-- CivicTrace Supabase schema (Postgres)
-- Project: CivicTrace (ref: gpmpicvzwavwukswhvcs, region: ap-south-1)
-- Run this in Supabase Studio > SQL Editor (or `supabase db push`)
-- Idempotent: safe to re-run.

-- ============ Tables ============

create table if not exists public.users (
  id text primary key,
  name text not null,
  contact text not null unique,
  role text not null default 'citizen' check (role in ('citizen', 'authority')),
  department_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id text primary key,
  name text not null,
  category text not null
);

create table if not exists public.complaints (
  id text primary key,
  tracking_code text not null unique,
  category text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  priority text not null default 'normal' check (priority in ('normal', 'urgent', 'very_urgent')),
  status text not null default 'REPORTED'
    check (status in ('REPORTED', 'ASSESSED', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED')),
  department_id text references public.departments(id),
  complainant_id text not null references public.users(id),
  support_count integer not null default 1,
  last_action_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists complaints_status_idx on public.complaints (status);
create index if not exists complaints_category_status_idx on public.complaints (category, status);
create index if not exists complaints_department_idx on public.complaints (department_id);

create table if not exists public.complaint_reports (
  id text primary key,
  complaint_id text not null references public.complaints(id) on delete cascade,
  reporter_id text not null references public.users(id),
  lat double precision,
  lng double precision,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists complaint_reports_complaint_idx on public.complaint_reports (complaint_id);

create table if not exists public.evidence (
  id text primary key,
  complaint_id text not null references public.complaints(id) on delete cascade,
  uploaded_by text not null references public.users(id),
  kind text not null default 'report' check (kind in ('report', 'proof_of_fix')),
  photo_ref text not null,
  photo_hash text not null,
  lat double precision,
  lng double precision,
  captured_at timestamptz not null default now()
);
create index if not exists evidence_complaint_idx on public.evidence (complaint_id);

-- Append-only hash chain: the "blockchain"
create table if not exists public.status_events (
  id text primary key,
  complaint_id text not null references public.complaints(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id text references public.users(id),
  actor_role text,
  note text,
  prev_hash text not null,
  this_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists status_events_complaint_idx on public.status_events (complaint_id, created_at);

create table if not exists public.notifications (
  id text primary key,
  department_id text not null references public.departments(id) on delete cascade,
  complaint_id text not null references public.complaints(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);
create index if not exists notifications_department_idx on public.notifications (department_id, created_at desc);

-- ============ RLS ============
-- Backend uses SERVICE_ROLE (bypasses RLS) and enforces hidden identity in code
-- (complainant_id stripped server-side). RLS below is defense-in-depth:
-- anon/authenticated get no direct row access; all access via backend.

alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_reports enable row level security;
alter table public.evidence enable row level security;
alter table public.status_events enable row level security;
alter table public.notifications enable row level security;

-- Drop existing permissive policies if re-running (keep it locked down)
drop policy if exists "service_role_all" on public.users;
drop policy if exists "service_role_all" on public.departments;
drop policy if exists "service_role_all" on public.complaints;
drop policy if exists "service_role_all" on public.complaint_reports;
drop policy if exists "service_role_all" on public.evidence;
drop policy if exists "service_role_all" on public.status_events;
drop policy if exists "service_role_all" on public.notifications;

-- Public read for departments + complaint tracking is done through the
-- Express backend (service_role), not direct PostgREST. No anon policies
-- created on purpose. Add them later only if the frontend talks to
-- Supabase directly.

-- ============ Seed ============
-- 4 departments (matches old SQLite seed). Run once.
insert into public.departments (id, name, category)
values
  ('dept_roads', 'Roads & Infrastructure', 'pothole'),
  ('dept_sanitation', 'Sanitation', 'garbage'),
  ('dept_parks', 'Parks & Trees', 'fallen_tree'),
  ('dept_water', 'Water Supply', 'water_leak')
on conflict (id) do nothing;
