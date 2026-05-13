alter table public.attendance
  alter column email drop not null,
  alter column poza_url drop not null,
  alter column qr_token drop not null;
