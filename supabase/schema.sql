-- Tripsy schema v1
-- Access model: RLS is ON for every table with NO anon/authenticated policies.
-- The browser never talks to the database directly; all reads/writes go through
-- Next.js server code using the service role key. Participants are identified by
-- the trip's share link + picking their name; the coordinator by a secret token.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table public.trips (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null check (length(trim(name)) between 1 and 80),
  coordinator_name       text not null,
  -- sha256 hex of the coordinator's secret link token (raw token is never stored)
  coordinator_token_hash text not null,
  -- short public code used in the shared WhatsApp link: /t/{share_code}
  share_code             text not null unique default encode(extensions.gen_random_bytes(6), 'hex'),
  base_currency          text not null default 'INR' check (base_currency ~ '^[A-Z]{3}$'),
  deadline               timestamptz not null,
  status                 text not null default 'collecting' check (status in ('collecting', 'locked')),
  created_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------
create table public.participants (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  name         text not null check (length(trim(name)) between 1 and 40),
  home_city    text not null,
  -- IATA code used for fare lookups, e.g. BOM, DEL. Nullable until confirmed.
  home_airport text check (home_airport is null or home_airport ~ '^[A-Z]{3}$'),
  created_at   timestamptz not null default now(),
  unique (trip_id, name)
);
create index on public.participants (trip_id);

-- ---------------------------------------------------------------------------
-- preferences (one row per participant; resubmitting overwrites)
-- ---------------------------------------------------------------------------
create table public.preferences (
  id                           uuid primary key default gen_random_uuid(),
  participant_id               uuid not null unique references public.participants(id) on delete cascade,
  trip_id                      uuid not null references public.trips(id) on delete cascade,
  budget_amount                numeric(12,2) not null check (budget_amount > 0),
  budget_currency              text not null check (budget_currency ~ '^[A-Z]{3}$'),
  -- [{"start":"2026-11-12","end":"2026-11-16"}, ...]
  available_date_ranges        jsonb not null default '[]'::jsonb check (jsonb_typeof(available_date_ranges) = 'array'),
  destination_type_preferences text[] not null default '{}',   -- e.g. {beach,mountains}
  hard_no_list                 text[] not null default '{}',   -- free text, e.g. {Goa,"long bus rides"}
  submitted_at                 timestamptz not null default now()
);
create index on public.preferences (trip_id);

-- ---------------------------------------------------------------------------
-- candidate_destinations
-- ---------------------------------------------------------------------------
create table public.candidate_destinations (
  id                              uuid primary key default gen_random_uuid(),
  trip_id                         uuid not null references public.trips(id) on delete cascade,
  destination_name                text not null,
  destination_airport             text check (destination_airport is null or destination_airport ~ '^[A-Z]{3}$'),
  destination_type                text,
  -- {"<participant_id>": {"amount": 8200, "currency": "INR", "status": "ok"}}
  -- status is 'ok' | 'unavailable'; amount is null when unavailable. Never invented.
  est_flight_cost_by_participant  jsonb not null default '{}'::jsonb,
  -- {"<participant_id>": true|false}
  fits_dates_by_participant       jsonb not null default '{}'::jsonb,
  -- Per-person, per-criterion scores and the reason text shown in "See the breakdown".
  score_breakdown                 jsonb not null default '{}'::jsonb,
  overall_score                   numeric(6,2),
  generated_at                    timestamptz not null default now()
);
create index on public.candidate_destinations (trip_id);

-- ---------------------------------------------------------------------------
-- decision (at most one current decision per trip)
-- ---------------------------------------------------------------------------
create table public.decision (
  id                     uuid primary key default gen_random_uuid(),
  trip_id                uuid not null unique references public.trips(id) on delete cascade,
  locked_destination_id  uuid not null references public.candidate_destinations(id),
  locked_at              timestamptz not null default now(),
  -- 'deadline' | 'all_responded' | coordinator name (manual lock)
  locked_by              text not null
);

-- Append-only audit trail of every lock / reopen, so nothing changes silently.
create table public.decision_events (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  event           text not null check (event in ('locked', 'reopened', 'deadline_changed')),
  -- options are regenerated while collecting, so keep the name even if the row goes away
  destination_id  uuid references public.candidate_destinations(id) on delete set null,
  destination_name text,
  actor           text not null,
  reason          text,
  created_at      timestamptz not null default now()
);
create index on public.decision_events (trip_id);

-- ---------------------------------------------------------------------------
-- Guardrail: a locked trip can only return to 'collecting' via reopen_trip().
-- Any other UPDATE that tries it is rejected by the database itself.
-- ---------------------------------------------------------------------------
create or replace function public.guard_trip_status()
returns trigger language plpgsql as $$
begin
  if old.status = 'locked' and new.status <> 'locked'
     and coalesce(current_setting('tripsy.allow_reopen', true), '') <> 'on' then
    raise exception 'Trip % is locked. Use reopen_trip() to reopen it deliberately.', old.id;
  end if;
  return new;
end $$;

create trigger trips_status_guard
  before update of status on public.trips
  for each row execute function public.guard_trip_status();

-- Lock: records the decision + audit event and flips status, atomically.
create or replace function public.lock_trip(p_trip_id uuid, p_destination_id uuid, p_locked_by text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from public.candidate_destinations
                 where id = p_destination_id and trip_id = p_trip_id) then
    raise exception 'Destination % does not belong to trip %', p_destination_id, p_trip_id;
  end if;

  update public.trips set status = 'locked'
   where id = p_trip_id and status = 'collecting';
  if not found then
    return; -- already locked; locking is idempotent, first lock wins
  end if;

  insert into public.decision (trip_id, locked_destination_id, locked_by)
  values (p_trip_id, p_destination_id, p_locked_by);

  insert into public.decision_events (trip_id, event, destination_id, destination_name, actor)
  select p_trip_id, 'locked', id, destination_name, p_locked_by
    from public.candidate_destinations where id = p_destination_id;
end $$;

-- Reopen: the only path from 'locked' back to 'collecting'. Requires a reason.
-- The app verifies the coordinator token before calling this.
create or replace function public.reopen_trip(p_trip_id uuid, p_actor text, p_reason text, p_new_deadline timestamptz)
returns void language plpgsql as $$
declare v_dest uuid;
begin
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required to reopen a locked trip';
  end if;

  select locked_destination_id into v_dest from public.decision where trip_id = p_trip_id;
  if v_dest is null then
    raise exception 'Trip % is not locked', p_trip_id;
  end if;

  perform set_config('tripsy.allow_reopen', 'on', true);  -- this transaction only
  update public.trips set status = 'collecting', deadline = p_new_deadline where id = p_trip_id;
  delete from public.decision where trip_id = p_trip_id;

  insert into public.decision_events (trip_id, event, destination_id, destination_name, actor, reason)
  select p_trip_id, 'reopened', id, destination_name, p_actor, p_reason
    from public.candidate_destinations where id = v_dest;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security: on everywhere, no public policies (server-only access).
-- ---------------------------------------------------------------------------
alter table public.trips                  enable row level security;
alter table public.participants           enable row level security;
alter table public.preferences            enable row level security;
alter table public.candidate_destinations enable row level security;
alter table public.decision               enable row level security;
alter table public.decision_events        enable row level security;

revoke execute on function public.lock_trip(uuid, uuid, text)                           from public, anon, authenticated;
revoke execute on function public.reopen_trip(uuid, text, text, timestamptz)            from public, anon, authenticated;
revoke execute on function public.guard_trip_status()                                   from public, anon, authenticated;
grant execute on function public.lock_trip(uuid, uuid, text)                             to service_role;
grant execute on function public.reopen_trip(uuid, text, text, timestamptz)              to service_role;
