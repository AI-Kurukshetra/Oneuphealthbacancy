create extension if not exists pgcrypto;

create type public.organization_type as enum ('hospital', 'clinic', 'insurance');
create type public.gender_type as enum ('male', 'female', 'other');
create type public.user_role as enum ('patient', 'provider', 'insurance', 'admin');
create type public.claim_status as enum ('pending', 'approved', 'rejected');
create type public.consent_access_type as enum ('full', 'clinical', 'claims', 'documents');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.organization_type not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  organization_id uuid null references public.organizations(id),
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  name text not null,
  dob date not null,
  gender public.gender_type not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  name text not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  specialty text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete restrict,
  date date not null,
  reason text not null,
  diagnosis text not null,
  source_system text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  type text not null,
  value text not null,
  unit text not null,
  date date not null,
  source_system text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  dosage text not null,
  prescribed_by text not null,
  source_system text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete restrict,
  amount numeric(12,2) not null,
  status public.claim_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  access_type public.consent_access_type not null,
  granted boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(patient_id, organization_id, access_type)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  mime_type text not null,
  bucket_path text not null,
  source_system text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_user_id on public.patients(user_id);
create index if not exists idx_providers_org on public.providers(organization_id);
create index if not exists idx_encounters_patient_date on public.encounters(patient_id, date desc);
create index if not exists idx_observations_patient_date on public.observations(patient_id, date desc);
create index if not exists idx_claims_patient_date on public.claims(patient_id, created_at desc);
create index if not exists idx_consents_lookup on public.consents(patient_id, organization_id, access_type);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consents_set_updated_at on public.consents;
create trigger consents_set_updated_at
before update on public.consents
for each row
execute function public.handle_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_patient_owner(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients pt
    where pt.id = p_patient_id
      and pt.user_id = auth.uid()
  );
$$;

create or replace function public.user_has_active_consent(
  p_patient_id uuid,
  p_org_id uuid,
  p_access_type public.consent_access_type
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.consents c
    where c.patient_id = p_patient_id
      and c.organization_id = p_org_id
      and c.granted = true
      and (c.access_type = p_access_type or c.access_type = 'full')
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'patient')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.providers enable row level security;
alter table public.encounters enable row level security;
alter table public.observations enable row level security;
alter table public.medications enable row level security;
alter table public.claims enable row level security;
alter table public.consents enable row level security;
alter table public.documents enable row level security;

create policy "organizations readable by authenticated"
on public.organizations
for select
to authenticated
using (true);

create policy "profiles select own or admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles update own or admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin')
with check (id = auth.uid() or public.current_user_role() = 'admin');

create policy "patients select by role and consent"
on public.patients
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or user_id = auth.uid()
  or (
    public.current_user_role() in ('provider', 'insurance')
    and public.current_org_id() is not null
    and public.user_has_active_consent(id, public.current_org_id(), 'full')
  )
);

create policy "patients insert by provider or admin"
on public.patients
for insert
to authenticated
with check (public.current_user_role() in ('provider', 'admin'));

create policy "patients update by owner or admin"
on public.patients
for update
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "providers readable by authenticated"
on public.providers
for select
to authenticated
using (true);

create policy "providers insert by admin"
on public.providers
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "encounters select by owner consent admin"
on public.encounters
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
  or (
    public.current_user_role() in ('provider', 'insurance')
    and public.current_org_id() is not null
    and public.user_has_active_consent(patient_id, public.current_org_id(), 'clinical')
  )
);

create policy "encounters insert by provider admin"
on public.encounters
for insert
to authenticated
with check (public.current_user_role() in ('provider', 'admin'));

create policy "observations select by owner consent admin"
on public.observations
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
  or (
    public.current_user_role() in ('provider', 'insurance')
    and public.current_org_id() is not null
    and public.user_has_active_consent(patient_id, public.current_org_id(), 'clinical')
  )
);

create policy "observations insert by provider admin"
on public.observations
for insert
to authenticated
with check (public.current_user_role() in ('provider', 'admin'));

create policy "medications select by owner consent admin"
on public.medications
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
  or (
    public.current_user_role() in ('provider', 'insurance')
    and public.current_org_id() is not null
    and public.user_has_active_consent(patient_id, public.current_org_id(), 'clinical')
  )
);

create policy "medications insert by provider admin"
on public.medications
for insert
to authenticated
with check (public.current_user_role() in ('provider', 'admin'));

create policy "claims select by owner consent admin"
on public.claims
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
  or (
    public.current_user_role() in ('provider', 'insurance')
    and public.current_org_id() is not null
    and public.user_has_active_consent(patient_id, public.current_org_id(), 'claims')
  )
);

create policy "claims insert by provider insurance admin"
on public.claims
for insert
to authenticated
with check (public.current_user_role() in ('provider', 'insurance', 'admin'));

create policy "consents select by patient org admin"
on public.consents
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
  or organization_id = public.current_org_id()
);

create policy "consents manage by patient or admin"
on public.consents
for all
to authenticated
using (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
)
with check (
  public.current_user_role() = 'admin'
  or public.is_patient_owner(patient_id)
);

create policy "documents select by owner consent admin"
on public.documents
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or uploaded_by = auth.uid()
  or public.is_patient_owner(patient_id)
  or (
    public.current_user_role() in ('provider', 'insurance')
    and public.current_org_id() is not null
    and public.user_has_active_consent(patient_id, public.current_org_id(), 'documents')
  )
);

create policy "documents insert by provider patient admin"
on public.documents
for insert
to authenticated
with check (public.current_user_role() in ('provider', 'patient', 'admin'));

insert into storage.buckets (id, name, public)
values ('health-reports', 'health-reports', false)
on conflict (id) do nothing;

create policy "health reports select"
on storage.objects
for select
to authenticated
using (bucket_id = 'health-reports');

create policy "health reports insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'health-reports');
