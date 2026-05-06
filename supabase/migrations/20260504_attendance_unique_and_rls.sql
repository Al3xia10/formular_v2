create unique index if not exists attendance_unique_email_session
on public.attendance (lower(email), session_id)
where session_id is not null;

alter table public.app_users enable row level security;
alter table public.disciplines enable row level security;
alter table public.academic_groups enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "app_users_no_direct_access" on public.app_users;
create policy "app_users_no_direct_access"
on public.app_users
for all
to authenticated
using (false)
with check (false);

drop policy if exists "disciplines_no_direct_access" on public.disciplines;
create policy "disciplines_no_direct_access"
on public.disciplines
for all
to authenticated
using (false)
with check (false);

drop policy if exists "academic_groups_no_direct_access" on public.academic_groups;
create policy "academic_groups_no_direct_access"
on public.academic_groups
for all
to authenticated
using (false)
with check (false);

drop policy if exists "attendance_sessions_no_direct_access" on public.attendance_sessions;
create policy "attendance_sessions_no_direct_access"
on public.attendance_sessions
for all
to authenticated
using (false)
with check (false);

drop policy if exists "attendance_no_direct_access" on public.attendance;
create policy "attendance_no_direct_access"
on public.attendance
for all
to authenticated
using (false)
with check (false);
