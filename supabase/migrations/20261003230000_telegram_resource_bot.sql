create table if not exists public.telegram_resources (
  id uuid primary key default gen_random_uuid(),
  semester text not null
    check (semester in ('1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2')),
  category text not null
    check (category in ('ct', 'final', 'notes', 'books')),
  ct_number smallint,
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  file_id text not null,
  file_name text,
  mime_type text,
  uploaded_by bigint not null,
  created_at timestamptz not null default now(),
  constraint telegram_resources_ct_number_check
    check (
      (category = 'ct' and ct_number between 1 and 4)
      or (category <> 'ct' and ct_number is null)
    )
);

create index if not exists telegram_resources_browse_idx
  on public.telegram_resources (semester, category, ct_number, created_at desc);

alter table public.telegram_resources enable row level security;
revoke all on public.telegram_resources from public, anon, authenticated;
grant all on public.telegram_resources to service_role;

create table if not exists public.telegram_resource_upload_sessions (
  telegram_user_id bigint primary key,
  telegram_chat_id bigint not null,
  stage text not null
    check (stage in ('semester', 'category', 'ct', 'title', 'document')),
  semester text
    check (semester is null or semester in ('1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2')),
  category text
    check (category is null or category in ('ct', 'final', 'notes', 'books')),
  ct_number smallint
    check (ct_number is null or ct_number between 1 and 4),
  title text
    check (title is null or char_length(btrim(title)) between 1 and 160),
  updated_at timestamptz not null default now()
);

alter table public.telegram_resource_upload_sessions enable row level security;
revoke all on public.telegram_resource_upload_sessions from public, anon, authenticated;
grant all on public.telegram_resource_upload_sessions to service_role;

create table if not exists public.telegram_resource_updates (
  update_id bigint primary key,
  created_at timestamptz not null default now()
);

create index if not exists telegram_resource_updates_created_idx
  on public.telegram_resource_updates (created_at);

alter table public.telegram_resource_updates enable row level security;
revoke all on public.telegram_resource_updates from public, anon, authenticated;
grant all on public.telegram_resource_updates to service_role;
