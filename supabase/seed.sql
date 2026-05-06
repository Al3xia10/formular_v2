insert into public.disciplines (name)
values
  ('Fiabilitate'),
  ('SEPC'),
  ('TMIE'),
  ('Automatizari I'),
  ('Automatizari II'),
  ('SDAI'),
  ('SDAE'),
  ('SSV'),
  ('Analiza integrata a sistemelor de securitate'),
  ('CMRA')
on conflict (name) do nothing;

insert into public.academic_groups (study_year, series, group_code)
select
  years.study_year,
  series_list.series,
  groups.group_code::text
from
  (values ('1'), ('2'), ('3'), ('4')) as years(study_year),
  (values ('A'), ('B'), ('C'), ('D')) as series_list(series),
  generate_series(1, 10) as groups(group_code)
on conflict (study_year, series, group_code) do nothing;

-- Completează local cu utilizatorii profesor/admin reali.
-- Exemplu:
-- insert into public.app_users (email, full_name, role)
-- values ('profesor@example.com', 'Profesor', 'professor')
-- on conflict (email) do update
-- set full_name = excluded.full_name,
--     role = excluded.role,
--     is_active = true;
