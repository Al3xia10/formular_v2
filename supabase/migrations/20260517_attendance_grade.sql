alter table public.attendance
  add column if not exists grade numeric(4, 2);
