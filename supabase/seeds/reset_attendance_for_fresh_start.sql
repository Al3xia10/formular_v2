begin;

delete from public.attendance_event_logs;
delete from public.attendance;
delete from public.attendance_sessions;

commit;

-- Dacă vrei și curățarea pozelor vechi din bucketul `prezente`,
-- aceea se face separat din Supabase Storage.
