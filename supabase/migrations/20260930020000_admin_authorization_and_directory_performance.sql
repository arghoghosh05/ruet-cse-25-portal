create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;

revoke select on public.profiles from public, anon;
grant select (
  id,
  full_name,
  roll,
  section,
  image_url,
  email,
  blood_group,
  address,
  phone_number,
  whatsapp_number,
  facebook_url
) on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;

drop policy if exists profiles_public_directory_select on public.profiles;
create policy profiles_public_directory_select
  on public.profiles
  as permissive
  for select
  to anon
  using (true);

drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select
  on public.profiles
  as permissive
  for select
  to authenticated
  using (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists profiles_admin_select_guard on public.profiles;
create policy profiles_admin_select_guard
  on public.profiles
  as restrictive
  for select
  to authenticated
  using (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists profiles_admin_insert_guard on public.profiles;
create policy profiles_admin_insert_guard
  on public.profiles
  as restrictive
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
  on public.profiles
  as permissive
  for update
  to authenticated
  using (public.is_admin() and created_by = (select auth.uid()))
  with check (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists profiles_admin_update_guard on public.profiles;
create policy profiles_admin_update_guard
  on public.profiles
  as restrictive
  for update
  to authenticated
  using (public.is_admin() and created_by = (select auth.uid()))
  with check (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete
  on public.profiles
  as permissive
  for delete
  to authenticated
  using (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists profiles_admin_delete_guard on public.profiles;
create policy profiles_admin_delete_guard
  on public.profiles
  as restrictive
  for delete
  to authenticated
  using (public.is_admin() and created_by = (select auth.uid()));

drop policy if exists avatars_admin_insert on storage.objects;
create policy avatars_admin_insert
  on storage.objects
  as permissive
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and public.is_admin());

drop policy if exists avatars_admin_insert_guard on storage.objects;
create policy avatars_admin_insert_guard
  on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (bucket_id <> 'avatars' or public.is_admin());

drop policy if exists avatars_admin_update on storage.objects;
create policy avatars_admin_update
  on storage.objects
  as permissive
  for update
  to authenticated
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());

drop policy if exists avatars_admin_update_guard on storage.objects;
create policy avatars_admin_update_guard
  on storage.objects
  as restrictive
  for update
  to authenticated
  using (bucket_id <> 'avatars' or public.is_admin())
  with check (bucket_id <> 'avatars' or public.is_admin());

drop policy if exists avatars_admin_delete on storage.objects;
create policy avatars_admin_delete
  on storage.objects
  as permissive
  for delete
  to authenticated
  using (bucket_id = 'avatars' and public.is_admin());

drop policy if exists avatars_admin_delete_guard on storage.objects;
create policy avatars_admin_delete_guard
  on storage.objects
  as restrictive
  for delete
  to authenticated
  using (bucket_id <> 'avatars' or public.is_admin());

update storage.buckets
set file_size_limit = 1500000,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

create index if not exists profiles_section_roll_idx
  on public.profiles (section, roll);

create index if not exists profiles_creator_created_at_idx
  on public.profiles (created_by, created_at desc);
