drop policy if exists profiles_student_own_select on public.profiles;
create policy profiles_student_own_select
  on public.profiles
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.student_accounts as student_account
      where student_account.user_id = (select auth.uid())
        and student_account.roll::text = profiles.roll::text
        and student_account.status = 'approved'
        and (
          profiles.created_by = (select auth.uid())
          or lower(btrim(coalesce(profiles.email, ''))) = student_account.email
        )
    )
  );

drop policy if exists profiles_admin_select_guard on public.profiles;
create policy profiles_admin_select_guard
  on public.profiles
  as restrictive
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.student_accounts as student_account
      where student_account.user_id = (select auth.uid())
        and student_account.roll::text = profiles.roll::text
        and student_account.status = 'approved'
        and (
          profiles.created_by = (select auth.uid())
          or lower(btrim(coalesce(profiles.email, ''))) = student_account.email
        )
    )
  );
