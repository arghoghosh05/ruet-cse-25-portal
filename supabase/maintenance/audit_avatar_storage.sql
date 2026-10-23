-- Avatar storage audit for the RUET CSE '25 portal
--
-- Run this in the Supabase SQL Editor (it runs as the database owner, so RLS
-- does not hide any rows). Every statement below is a SELECT: nothing is
-- modified, so it is safe to run on production.
--
-- Why this exists: the portal uploads avatars straight from the browser at up
-- to 15 MB (src/lib/profile-image.ts) with no resizing, stores them in the
-- public `avatars` bucket, renders them with `unoptimized` in the directory,
-- and never deletes a replaced photo. That combination is what inflates
-- cached egress and storage.
--
-- Deleting rows from storage.objects with SQL removes the database record but
-- leaves the file in the underlying object store, so do the actual deletion
-- through the Storage API (Dashboard -> Storage -> avatars, or
-- `supabase.storage.from('avatars').remove([...])` with the service role key)
-- using the file names these queries return. See the notes at the bottom.

-- 1. How much is stored, per bucket, and how many objects are oversized.
select
  bucket_id,
  count(*) as objects,
  pg_size_pretty(sum(coalesce((metadata ->> 'size')::bigint, 0))) as total_size,
  count(*) filter (where coalesce((metadata ->> 'size')::bigint, 0) > 1000000) as objects_over_1mb,
  count(*) filter (where coalesce((metadata ->> 'size')::bigint, 0) > 5000000) as objects_over_5mb
from storage.objects
group by bucket_id
order by sum(coalesce((metadata ->> 'size')::bigint, 0)) desc nulls last;

-- 2. The 20 heaviest avatar objects.
select
  name,
  pg_size_pretty((metadata ->> 'size')::bigint) as size,
  metadata ->> 'mimetype' as mimetype,
  created_at
from storage.objects
where bucket_id = 'avatars'
order by (metadata ->> 'size')::bigint desc nulls last
limit 20;

-- 3. Avatar objects that nothing references any more.
--    `profiles.image_url` and `student_submissions.image_url` hold full public
--    URLs, so the storage path is everything after `/avatars/`.
with referenced as (
  select split_part(image_url, '/avatars/', 2) as name
  from public.profiles
  where image_url like '%/avatars/%'
  union
  select split_part(image_url, '/avatars/', 2)
  from public.student_submissions
  where image_url like '%/avatars/%'
)
select
  o.name,
  pg_size_pretty(coalesce((o.metadata ->> 'size')::bigint, 0)) as size,
  o.created_at
from storage.objects o
left join referenced r on r.name = o.name
where o.bucket_id = 'avatars'
  and r.name is null
order by coalesce((o.metadata ->> 'size')::bigint, 0) desc;

-- 4. How much that would reclaim, before you delete anything.
with referenced as (
  select split_part(image_url, '/avatars/', 2) as name
  from public.profiles
  where image_url like '%/avatars/%'
  union
  select split_part(image_url, '/avatars/', 2)
  from public.student_submissions
  where image_url like '%/avatars/%'
)
select
  count(*) as orphan_objects,
  pg_size_pretty(sum(coalesce((o.metadata ->> 'size')::bigint, 0))) as reclaimable,
  count(*) filter (where coalesce((o.metadata ->> 'size')::bigint, 0) > 1000000) as orphans_over_1mb
from storage.objects o
left join referenced r on r.name = o.name
where o.bucket_id = 'avatars'
  and r.name is null;

-- 5. Students who uploaded more than once. The extra versions are almost
--    always dead weight: each upload writes a fresh `<user_id>/<uuid>.<ext>`
--    object and nothing ever removes the previous one.
select
  split_part(name, '/', 1) as user_id,
  count(*) as stored_versions,
  pg_size_pretty(sum(coalesce((metadata ->> 'size')::bigint, 0))) as total_size,
  min(created_at) as first_upload,
  max(created_at) as last_upload
from storage.objects
where bucket_id = 'avatars'
group by split_part(name, '/', 1)
having count(*) > 1
order by count(*) desc;

-- 6. Directory and submission volume, to size the migration.
select
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.student_submissions) as submissions,
  (select count(*) from public.student_accounts) as student_accounts,
  (select count(*) from public.telegram_resources) as telegram_resources,
  (select count(*) from public.telegram_resource_updates) as telegram_resource_updates,
  (select count(*) from public.telegram_resource_upload_sessions) as telegram_upload_sessions;
