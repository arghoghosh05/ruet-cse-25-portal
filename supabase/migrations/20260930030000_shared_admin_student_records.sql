drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select
  on public.profiles
  as permissive
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists profiles_admin_select_guard on public.profiles;
create policy profiles_admin_select_guard
  on public.profiles
  as restrictive
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
  on public.profiles
  as permissive
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists profiles_admin_update_guard on public.profiles;
create policy profiles_admin_update_guard
  on public.profiles
  as restrictive
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

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
