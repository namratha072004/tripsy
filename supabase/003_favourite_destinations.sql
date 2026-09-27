-- Migration 003: places a person hand-picked (empty = "let Tripsy choose"). Additive.
alter table public.preferences
  add column if not exists favourite_destinations text[] not null default '{}';
