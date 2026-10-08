alter table public.profiles
  add column if not exists nickname text;

grant select (nickname) on public.profiles to anon;
