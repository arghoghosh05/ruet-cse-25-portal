drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete
  on public.profiles
  as permissive
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists profiles_admin_delete_guard on public.profiles;
create policy profiles_admin_delete_guard
  on public.profiles
  as restrictive
  for delete
  to authenticated
  using (public.is_admin());
