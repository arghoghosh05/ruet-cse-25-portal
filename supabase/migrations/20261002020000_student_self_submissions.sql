create table public.student_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  nickname text,
  roll integer not null,
  section text not null,
  address text not null,
  phone_number text not null,
  whatsapp_number text not null,
  blood_group text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint student_submissions_roll_check check (roll between 2503001 and 2503180),
  constraint student_submissions_section_check check (section in ('a', 'b', 'c')),
  constraint student_submissions_blood_group_check
    check (blood_group is null or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint student_submissions_nickname_length
    check (nickname is null or char_length(nickname) <= 40),
  constraint student_submissions_name_length
    check (char_length(btrim(full_name)) between 2 and 120),
  constraint student_submissions_address_length
    check (char_length(btrim(address)) between 2 and 100),
  constraint student_submissions_phone_length
    check (char_length(btrim(phone_number)) between 5 and 32),
  constraint student_submissions_whatsapp_length
    check (char_length(btrim(whatsapp_number)) between 5 and 32)
);

create unique index student_submissions_one_pending_roll_idx
  on public.student_submissions (roll)
  where status = 'pending';

create unique index student_submissions_one_active_user_idx
  on public.student_submissions (user_id)
  where status in ('pending', 'approved');

create index student_submissions_pending_created_idx
  on public.student_submissions (submitted_at desc)
  where status = 'pending';

alter table public.student_submissions enable row level security;
revoke all on public.student_submissions from public, anon, authenticated;
grant select on public.student_submissions to authenticated;

create policy student_submissions_owner_or_admin_select
  on public.student_submissions
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create function public.submit_student_profile(
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
    raise exception using errcode = '28000', message = 'Sign in with your verified email first.';
  end if;

  if not exists (
    select 1
    from auth.users as auth_user
    where auth_user.id = v_user_id
      and auth_user.email_confirmed_at is not null
  ) then
    raise exception using errcode = '28000', message = 'Verify your email before submitting a profile.';
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

create function public.review_student_submission(
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
  end if;

  update public.student_submissions
  set status = p_decision,
      reviewed_at = now()
  where id = p_submission_id;
end;
$$;

revoke all on function public.review_student_submission(uuid, text) from public, anon;
grant execute on function public.review_student_submission(uuid, text) to authenticated;
