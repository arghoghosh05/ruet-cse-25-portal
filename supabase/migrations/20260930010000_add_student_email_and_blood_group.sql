alter table public.profiles
  add column if not exists email text,
  add column if not exists blood_group text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_blood_group_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_blood_group_check
      check (
        blood_group is null
        or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
      );
  end if;
end;
$$;
