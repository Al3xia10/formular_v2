create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null check (role in ('student', 'professor', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.disciplines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_groups (
  id uuid primary key default gen_random_uuid(),
  study_year text not null,
  series text not null,
  group_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (study_year, series, group_code)
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  professor_email text not null,
  discipline_id uuid references public.disciplines(id) on delete restrict,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.attendance
  add column if not exists session_id uuid references public.attendance_sessions(id) on delete set null,
  add column if not exists discipline_id uuid references public.disciplines(id) on delete set null,
  add column if not exists academic_group_id uuid references public.academic_groups(id) on delete set null,
  add column if not exists submitted_at timestamptz not null default now();

create index if not exists idx_attendance_email on public.attendance(email);
create index if not exists idx_attendance_disciplina on public.attendance(disciplina);
create index if not exists idx_attendance_discipline_id on public.attendance(discipline_id);
create index if not exists idx_attendance_academic_group_id on public.attendance(academic_group_id);
create index if not exists idx_attendance_session_id on public.attendance(session_id);
create index if not exists idx_app_users_email on public.app_users(email);
create index if not exists idx_disciplines_name on public.disciplines(name);
