-- CivicTrace: password auth for users (run once in Supabase Studio > SQL Editor).
-- Required BEFORE deploying the backend commit "password auth" — new signups
-- insert into password_hash, which fails without this column.
-- Existing rows keep password_hash NULL (legacy demo accounts); the backend
-- sets the hash on their next login (one-time claim) and verifies after that.

alter table public.users
  add column if not exists password_hash text;
