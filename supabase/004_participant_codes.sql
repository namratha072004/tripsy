-- Migration 004: a private 6-character code per person, so only they can open
-- and save their own answers. Additive; existing rows get a code from the default.
-- Stored in plain text on purpose: the organiser page shows it so they can
-- send each friend their personal link.
alter table public.participants
  add column if not exists access_code text not null
  default upper(substr(md5(gen_random_uuid()::text), 1, 6));
