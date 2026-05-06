create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  search_name text not null default '',
  email text,
  study_year text not null,
  series text not null default '',
  group_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists students_email_unique
  on public.students(lower(email))
  where email is not null;

create index if not exists idx_students_full_name
  on public.students(full_name);

create index if not exists idx_students_search_name
  on public.students(search_name);

create index if not exists idx_students_group_lookup
  on public.students(study_year, series, group_code);

create unique index if not exists students_name_group_unique
  on public.students(lower(full_name), study_year, series, group_code);

alter table public.attendance
  add column if not exists student_id uuid references public.students(id) on delete set null;

create index if not exists idx_attendance_student_id
  on public.attendance(student_id);

alter table public.students enable row level security;

drop policy if exists students_no_direct_access on public.students;
create policy students_no_direct_access
  on public.students
  for all
  to authenticated
  using (false)
  with check (false);
