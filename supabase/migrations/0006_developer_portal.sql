create table if not exists public.developers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  organization_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  key text not null unique,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists public.api_requests (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  path text not null,
  method text not null,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_developer_id_idx on public.api_keys (developer_id);
create index if not exists api_requests_developer_id_idx on public.api_requests (developer_id);
create index if not exists api_requests_api_key_id_idx on public.api_requests (api_key_id);
create index if not exists api_requests_created_at_idx on public.api_requests (created_at desc);
