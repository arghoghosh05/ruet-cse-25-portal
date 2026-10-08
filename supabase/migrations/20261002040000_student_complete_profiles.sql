alter table public.student_submissions
  add column email text,
  add column facebook_url text,
  add column image_url text;

drop policy if exists avatars_student_insert on storage.objects;
create policy avatars_student_insert
  on storage.objects
  as permissive
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatars_admin_insert_guard on storage.objects;
create policy avatars_admin_insert_guard
  on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (
    bucket_id <> 'avatars'
    or public.is_admin()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop function public.submit_student_profile(text, text, text, text, text, text, text, boolean);

create function public.submit_student_profile(
  p_full_name text,
  p_roll text,
  p_nickname text,
  p_address text,
  p_phone_number text,
  p_whatsapp_number text,
  p_blood_group text,
  p_public_consent boolean,
  p_facebook_url text,
  p_image_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_section text;
  v_submission_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Sign in with your approved student account first.';
  end if;

  select lower(btrim(auth_user.email))
  into v_email
  from auth.users as auth_user
  where auth_user.id = v_user_id
    and auth_user.email_confirmed_at is not null;

  if v_email is null then
    raise exception using errcode = '28000', message = 'Verify your email before submitting a profile.';
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
  if p_facebook_url is not null and (
    char_length(p_facebook_url) > 500
    or p_facebook_url !~* '^https?://[^[:space:]]+$'
  ) then
    raise exception using errcode = '22023', message = 'Enter a valid Facebook profile URL.';
  end if;
  if p_image_url is not null and (
    char_length(p_image_url) > 2048
    or p_image_url !~ (
      '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/'
      || v_user_id::text
      || '/[0-9a-f-]{36}\.(jpg|png|webp)$'
    )
  ) then
    raise exception using errcode = '22023', message = 'Choose a valid uploaded profile photo.';
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
    select 1 from public.profiles as profile where profile.roll::text = p_roll
  ) then
    raise exception using errcode = '23505', message = 'A profile with that roll number is already in the directory.';
  end if;

  insert into public.student_submissions (
    user_id, full_name, nickname, roll, section, address, phone_number,
    whatsapp_number, blood_group, email, facebook_url, image_url
  )
  values (
    v_user_id, btrim(p_full_name), nullif(btrim(coalesce(p_nickname, '')), ''),
    p_roll::integer, v_section, btrim(p_address), btrim(p_phone_number),
    btrim(p_whatsapp_number), nullif(p_blood_group, ''), v_email,
    nullif(btrim(coalesce(p_facebook_url, '')), ''), p_image_url
  )
  returning id into v_submission_id;

  return v_submission_id;
end;
$$;

revoke all on function public.submit_student_profile(text, text, text, text, text, text, text, boolean, text, text) from public, anon;
grant execute on function public.submit_student_profile(text, text, text, text, text, text, text, boolean, text, text) to authenticated;

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
  where id = p_submission_id and status = 'pending'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'This submission is no longer pending.';
  end if;

  if p_decision = 'approved' then
    if exists (
      select 1 from public.profiles as profile
      where profile.roll::text = v_submission.roll::text
    ) then
      raise exception using errcode = '23505', message = 'A profile with this roll number already exists.';
    end if;

    insert into public.profiles (
      full_name, nickname, roll, section, address, phone_number,
      whatsapp_number, email, blood_group, image_url, facebook_url, created_by
    )
    values (
      v_submission.full_name, v_submission.nickname, v_submission.roll,
      v_submission.section, v_submission.address, v_submission.phone_number,
      v_submission.whatsapp_number, v_submission.email, v_submission.blood_group,
      v_submission.image_url, v_submission.facebook_url, v_submission.user_id
    );

    update public.student_accounts
    set has_profile = true
    where roll = v_submission.roll and user_id = v_submission.user_id;
  end if;

  update public.student_submissions
  set status = p_decision, reviewed_at = now()
  where id = p_submission_id;
end;
$$;

revoke all on function public.review_student_submission(uuid, text) from public, anon;
grant execute on function public.review_student_submission(uuid, text) to authenticated;

create function public.update_own_student_profile(
  p_full_name text,
  p_nickname text,
  p_address text,
  p_phone_number text,
  p_whatsapp_number text,
  p_blood_group text,
  p_facebook_url text,
  p_image_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_account public.student_accounts%rowtype;
  v_email text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Sign in with your approved student account first.';
  end if;

  select *
  into v_account
  from public.student_accounts
  where user_id = v_user_id and status = 'approved';
  if not found then
    raise exception using errcode = '42501', message = 'An approved student account is required to edit a profile.';
  end if;

  select lower(btrim(auth_user.email))
  into v_email
  from auth.users as auth_user
  where auth_user.id = v_user_id
    and auth_user.email_confirmed_at is not null;
  if v_email is null then
    raise exception using errcode = '28000', message = 'Verify your email before editing a profile.';
  end if;
  if p_full_name is null or char_length(btrim(p_full_name)) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Enter a name between 2 and 120 characters.';
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
  if p_facebook_url is not null and (
    char_length(p_facebook_url) > 500
    or p_facebook_url !~* '^https?://[^[:space:]]+$'
  ) then
    raise exception using errcode = '22023', message = 'Enter a valid Facebook profile URL.';
  end if;
  if p_image_url is not null and (
    char_length(p_image_url) > 2048
    or p_image_url !~ (
      '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/'
      || v_user_id::text
      || '/[0-9a-f-]{36}\.(jpg|png|webp)$'
    )
  ) then
    raise exception using errcode = '22023', message = 'Choose a valid uploaded profile photo.';
  end if;

  update public.profiles as profile
  set full_name = btrim(p_full_name),
      nickname = nullif(btrim(coalesce(p_nickname, '')), ''),
      address = btrim(p_address),
      phone_number = btrim(p_phone_number),
      whatsapp_number = btrim(p_whatsapp_number),
      blood_group = nullif(p_blood_group, ''),
      facebook_url = nullif(btrim(coalesce(p_facebook_url, '')), ''),
      image_url = coalesce(p_image_url, profile.image_url),
      email = v_email
  where profile.roll = v_account.roll
    and (
      profile.created_by = v_user_id
      or lower(btrim(coalesce(profile.email, ''))) = v_account.email
    );

  if not found then
    raise exception using errcode = '42501', message = 'Your approved account is not authorized to edit this profile.';
  end if;
end;
$$;

revoke all on function public.update_own_student_profile(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.update_own_student_profile(text, text, text, text, text, text, text, text) to authenticated;
