-- CivicTrace email-OTP auth storage.
-- Run this ONCE in Supabase Studio > SQL Editor on your project.
-- (The backend works without it via a dev in-memory fallback, but OTPs
-- only survive restarts once this table exists.)
-- Idempotent: safe to re-run.

create table if not exists public.auth_otps (
  id text primary key,
  email text not null,
  code_hash text not null,
  purpose text not null check (purpose in ('signup', 'login')),
  attempts integer not null default 0,
  consumed boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_otps_email_idx
  on public.auth_otps (email, created_at desc);

alter table public.auth_otps enable row level security;

-- No anon/authenticated policies on purpose: the Express backend uses
-- service_role (bypasses RLS). Add policies only if clients ever touch
-- this table directly (they shouldn't — OTP hashes must stay server-side).
drop policy if exists "service_role_all" on public.auth_otps;
