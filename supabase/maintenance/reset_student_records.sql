-- One-time destructive reset: removes every student record but preserves the
-- profiles table, its columns, policies, and all Supabase Auth accounts.
-- Run manually in the SQL Editor for the RUET production Supabase project.
begin;

delete from public.profiles;

commit;

select count(*) as remaining_student_records
from public.profiles;
