-- CivicTrace Round 3: exact location detection + verification system.
-- Run once in Supabase Studio > SQL Editor (project dqkxccbvffoqelwwwctu).
-- Idempotent: safe to re-run. Old complaints keep working (new columns nullable).
--
-- What it adds:
--   complaints: confirmed location (accuracy/address/source/timestamp/hash)
--               + proof-of-fix resolution location + distance to report.
--   status_events.location_hash: commits the canonical location into the
--               tamper-evident hash chain (NULL on pre-migration events, which
--               still verify exactly as before).

alter table public.complaints
  add column if not exists location_accuracy double precision,
  add column if not exists location_address text,
  add column if not exists location_source text
    check (location_source in ('gps', 'map_search', 'manual_adjustment')),
  add column if not exists location_confirmed boolean not null default false,
  add column if not exists location_timestamp timestamptz,
  add column if not exists location_hash text,
  add column if not exists resolution_lat double precision,
  add column if not exists resolution_lng double precision,
  add column if not exists resolution_location_accuracy double precision,
  add column if not exists resolution_timestamp timestamptz,
  add column if not exists proof_distance_m double precision;

alter table public.status_events
  add column if not exists location_hash text;

create index if not exists complaints_location_idx
  on public.complaints (category, status, lat, lng);
