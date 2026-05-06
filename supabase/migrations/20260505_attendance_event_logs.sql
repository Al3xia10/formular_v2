create table if not exists public.attendance_event_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  status text not null check (status in ('info', 'success', 'rejected', 'error')),
  reason_code text,
  session_id uuid references public.attendance_sessions(id) on delete set null,
  attendance_id uuid references public.attendance(id) on delete set null,
  email text,
  professor_email text,
  discipline_id uuid references public.disciplines(id) on delete set null,
  academic_group_id uuid references public.academic_groups(id) on delete set null,
  ip_address text,
  user_agent text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists idx_attendance_event_logs_created_at
  on public.attendance_event_logs(created_at desc);

create index if not exists idx_attendance_event_logs_session_id
  on public.attendance_event_logs(session_id);

create index if not exists idx_attendance_event_logs_reason_code
  on public.attendance_event_logs(reason_code);

create index if not exists idx_attendance_event_logs_professor_email
  on public.attendance_event_logs(professor_email);

alter table public.attendance_event_logs enable row level security;

drop policy if exists attendance_event_logs_no_direct_access on public.attendance_event_logs;
create policy attendance_event_logs_no_direct_access
  on public.attendance_event_logs
  for all
  to authenticated
  using (false)
  with check (false);
