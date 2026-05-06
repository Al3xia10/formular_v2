update public.attendance as a
set student_id = s.id
from public.students as s
where a.student_id is null
  and lower(a.nume) = lower(s.full_name)
  and a.an = s.study_year
  and a.grupa = s.group_code
  and (
    a.serie = s.series
    or s.series = ''
  );
