alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

update public.profiles p
set email = coalesce(p.email, u.email)
from auth.users u
where u.id = p.id
  and p.email is null;

update public.profiles p
set full_name = coalesce(
  p.full_name,
  nullif(u.raw_user_meta_data ->> 'full_name', ''),
  split_part(coalesce(u.email, ''), '@', 1)
)
from auth.users u
where u.id = p.id
  and p.full_name is null;

alter table if exists public.providers
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_providers_user_id_unique
  on public.providers (user_id)
  where user_id is not null;
