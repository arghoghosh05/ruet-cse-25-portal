create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_allowlist (
  email text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint admin_allowlist_email_lowercase
    check (email = lower(btrim(email)))
);

alter table private.admin_allowlist enable row level security;
revoke all on private.admin_allowlist from public, anon, authenticated;

insert into private.admin_allowlist (email)
values
  ('admin1@gmail.com'),
  ('admin2@gmail.com'),
  ('admin3@gmail.com'),
  ('admin4@gmail.com'),
  ('admin5@gmail.com'),
  ('admin6@gmail.com'),
  ('arghoghosh0712@gmail.com')
on conflict (email) do update
set enabled = true,
    updated_at = now();

update auth.users
set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
    updated_at = now()
where lower(email) in (
  'admin1@gmail.com',
  'admin2@gmail.com',
  'admin3@gmail.com',
  'admin4@gmail.com',
  'admin5@gmail.com',
  'admin6@gmail.com',
  'arghoghosh0712@gmail.com'
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
    and exists (
      select 1
      from private.admin_allowlist as allowed_admin
      where allowed_admin.enabled
        and allowed_admin.email = lower(auth.jwt() ->> 'email')
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
