-- Migration 002: can this person travel internationally? Additive, non-destructive.
alter table public.preferences
  add column if not exists open_to_abroad boolean not null default true;
