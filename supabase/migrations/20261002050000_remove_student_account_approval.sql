update public.student_accounts
set status = 'approved',
    reviewed_at = coalesce(reviewed_at, now())
where status <> 'approved';

update public.student_accounts as student_account
set has_profile = exists (
  select 1
  from public.profiles as profile
  where profile.roll::text = student_account.roll::text
    and (
      profile.created_by = student_account.user_id
      or lower(btrim(coalesce(profile.email, ''))) = student_account.email
    )
);

drop function if exists public.review_student_account(integer, text);

create or replace function public.register_student_account(p_roll text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_roll integer;
  v_existing_roll integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Verify your email before creating an account.';
  end if;

  if p_roll is null or p_roll !~ '^[0-9]{7}$' then
    raise exception using errcode = '22023', message = 'Enter a valid seven-digit roll number.';
  end if;

  v_roll := p_roll::integer;
  if v_roll not between 2503001 and 2503180 then
    raise exception using errcode = '22023', message = 'That roll number is outside the CSE 25-series range.';
  end if;

  select lower(btrim(auth_user.email))
  into v_email
  from auth.users as auth_user
  where auth_user.id = v_user_id
    and auth_user.email_confirmed_at is not null;

  if v_email is null then
    raise exception using errcode = '28000', message = 'Verify your email before creating an account.';
  end if;

  select roll
  into v_existing_roll
  from public.student_accounts
  where user_id = v_user_id;

  if found then
    if v_existing_roll <> v_roll then
      raise exception using errcode = '23505', message = 'Your email is already linked to another student roll.';
    end if;

    update public.student_accounts
    set email = v_email,
        status = 'approved',
        reviewed_at = coalesce(reviewed_at, now())
    where user_id = v_user_id;

    return 'approved';
  end if;

  insert into public.student_accounts (roll, user_id, email, has_profile, status, reviewed_at)
  values (
    v_roll,
    v_user_id,
    v_email,
    exists (
      select 1
      from public.profiles as profile
      where profile.roll::text = v_roll::text
        and (
          profile.created_by = v_user_id
          or lower(btrim(coalesce(profile.email, ''))) = v_email
        )
    ),
    'approved',
    now()
  );

  return 'approved';
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'This roll number or email is already linked to another account.';
end;
$$;

revoke all on function public.register_student_account(text) from public, anon;
grant execute on function public.register_student_account(text) to authenticated;
