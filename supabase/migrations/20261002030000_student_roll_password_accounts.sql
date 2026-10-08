create table public.student_accounts (
  roll integer primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  has_profile boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint student_accounts_roll_check check (roll between 2503001 and 2503180),
  constraint student_accounts_email_lowercase check (email = lower(btrim(email)))
);

create index student_accounts_pending_created_idx
  on public.student_accounts (created_at)
  where status = 'pending';

alter table public.student_accounts enable row level security;
revoke all on public.student_accounts from public, anon, authenticated;
grant select on public.student_accounts to authenticated;

create policy student_accounts_owner_or_admin_select
  on public.student_accounts
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create function public.register_student_account(p_roll text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_roll integer;
  v_status text;
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

  select roll, status
  into v_existing_roll, v_status
  from public.student_accounts
  where user_id = v_user_id;

  if found then
    if v_existing_roll <> v_roll then
      raise exception using errcode = '23505', message = 'Your email is already linked to another student roll.';
    end if;
    return v_status;
  end if;

  insert into public.student_accounts (roll, user_id, email, has_profile, status)
  values (
    v_roll,
    v_user_id,
    v_email,
    exists (
      select 1
      from public.profiles as profile
      where profile.roll::text = v_roll::text
    ),
    case
      when exists (
        select 1
        from public.profiles as profile
        where profile.roll::text = v_roll::text
          and lower(btrim(coalesce(profile.email, ''))) = v_email
      ) then 'approved'
      else 'pending'
    end
  );

  select status
  into v_status
  from public.student_accounts
  where user_id = v_user_id
    and roll = v_roll;

  if v_status is null then
    raise exception using errcode = '23505', message = 'This roll number is already linked to another account.';
  end if;

  return v_status;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'This roll number or email is already linked to another account.';
end;
$$;

revoke all on function public.register_student_account(text) from public, anon;
grant execute on function public.register_student_account(text) to authenticated;

create function public.review_student_account(
  p_roll integer,
  p_decision text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'Admin access is required.';
  end if;

  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception using errcode = '22023', message = 'Choose approve or reject.';
  end if;

  if p_decision = 'rejected' then
    delete from public.student_accounts
    where roll = p_roll
      and status = 'pending';
  else
    update public.student_accounts
    set status = 'approved',
        has_profile = exists (
          select 1
          from public.profiles as profile
          where profile.roll::text = p_roll::text
        ),
        reviewed_at = now()
    where roll = p_roll
      and status = 'pending';
  end if;

  if not found then
    raise exception using errcode = 'P0002', message = 'This account request is no longer pending.';
  end if;
end;
$$;

revoke all on function public.review_student_account(integer, text) from public, anon;
grant execute on function public.review_student_account(integer, text) to authenticated;

create or replace function public.submit_student_profile(
  p_full_name text,
  p_roll text,
  p_nickname text,
  p_address text,
  p_phone_number text,
  p_whatsapp_number text,
  p_blood_group text,
  p_public_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_section text;
  v_submission_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Sign in with your approved student account first.';
  end if;

  if not exists (
    select 1
    from public.student_accounts as student_account
    where student_account.user_id = v_user_id
      and student_account.roll::text = p_roll
      and student_account.status = 'approved'
  ) then
    raise exception using errcode = '42501', message = 'Your roll-number account must be approved before submitting a profile.';
  end if;

  if p_public_consent is distinct from true then
    raise exception using errcode = '22023', message = 'Confirm the public profile notice before submitting.';
  end if;
  if p_full_name is null or char_length(btrim(p_full_name)) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Enter a name between 2 and 120 characters.';
  end if;
  if p_roll is null or p_roll !~ '^[0-9]{7}$' then
    raise exception using errcode = '22023', message = 'Enter a valid seven-digit roll number.';
  end if;
  if p_nickname is not null and char_length(btrim(p_nickname)) > 40 then
    raise exception using errcode = '22023', message = 'Nickname must be 40 characters or fewer.';
  end if;
  if p_address is null or char_length(btrim(p_address)) not between 2 and 100 then
    raise exception using errcode = '22023', message = 'Select a valid district.';
  end if;
  if p_phone_number is null or char_length(btrim(p_phone_number)) not between 5 and 32 then
    raise exception using errcode = '22023', message = 'Enter a valid phone number.';
  end if;
  if p_whatsapp_number is null or char_length(btrim(p_whatsapp_number)) not between 5 and 32 then
    raise exception using errcode = '22023', message = 'Enter a valid WhatsApp number.';
  end if;
  if p_blood_group is not null and p_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then
    raise exception using errcode = '22023', message = 'Select a valid blood group.';
  end if;

  v_section := case
    when p_roll::integer between 2503001 and 2503060 then 'a'
    when p_roll::integer between 2503061 and 2503120 then 'b'
    when p_roll::integer between 2503121 and 2503180 then 'c'
    else null
  end;
  if v_section is null then
    raise exception using errcode = '22023', message = 'That roll number is outside the CSE 25-series range.';
  end if;

  if exists (
    select 1
    from public.profiles as profile
    where profile.roll::text = p_roll
  ) then
    raise exception using errcode = '23505', message = 'A profile with that roll number is already in the directory.';
  end if;

  insert into public.student_submissions (
    user_id,
    full_name,
    nickname,
    roll,
    section,
    address,
    phone_number,
    whatsapp_number,
    blood_group
  )
  values (
    v_user_id,
    btrim(p_full_name),
    nullif(btrim(coalesce(p_nickname, '')), ''),
    p_roll::integer,
    v_section,
    btrim(p_address),
    btrim(p_phone_number),
    btrim(p_whatsapp_number),
    nullif(p_blood_group, '')
  )
  returning id into v_submission_id;

  return v_submission_id;
end;
$$;

revoke all on function public.submit_student_profile(text, text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.submit_student_profile(text, text, text, text, text, text, text, boolean) to authenticated;

create or replace function public.review_student_submission(
  p_submission_id uuid,
  p_decision text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.student_submissions%rowtype;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'Admin access is required.';
  end if;

  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception using errcode = '22023', message = 'Choose approve or reject.';
  end if;

  select *
  into v_submission
  from public.student_submissions
  where id = p_submission_id
    and status = 'pending'
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'This submission is no longer pending.';
  end if;

  if p_decision = 'approved' then
    if exists (
      select 1
      from public.profiles as profile
      where profile.roll::text = v_submission.roll::text
    ) then
      raise exception using errcode = '23505', message = 'A profile with this roll number already exists.';
    end if;

    insert into public.profiles (
      full_name,
      nickname,
      roll,
      section,
      address,
      phone_number,
      whatsapp_number,
      email,
      blood_group,
      image_url,
      facebook_url,
      created_by
    )
    select
      profile.full_name,
      profile.nickname,
      profile.roll,
      profile.section,
      profile.address,
      profile.phone_number,
      profile.whatsapp_number,
      profile.email,
      profile.blood_group,
      profile.image_url,
      profile.facebook_url,
      v_submission.user_id
    from jsonb_populate_record(
      null::public.profiles,
      jsonb_build_object(
        'full_name', v_submission.full_name,
        'nickname', v_submission.nickname,
        'roll', v_submission.roll,
        'section', v_submission.section,
        'address', v_submission.address,
        'phone_number', v_submission.phone_number,
        'whatsapp_number', v_submission.whatsapp_number,
        'email', null,
        'blood_group', v_submission.blood_group,
        'image_url', null,
        'facebook_url', null,
        'created_by', v_submission.user_id
      )
    ) as profile;

    update public.student_accounts
    set has_profile = true
    where roll::text = v_submission.roll::text;
  end if;

  update public.student_submissions
  set status = p_decision,
      reviewed_at = now()
  where id = p_submission_id;
end;
$$;

revoke all on function public.review_student_submission(uuid, text) from public, anon;
grant execute on function public.review_student_submission(uuid, text) to authenticated;
