create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text,
  type text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  name text,
  specialty text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text,
  last_name text,
  date_of_birth date,
  gender text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  visit_date timestamptz,
  reason text,
  diagnosis text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  type text,
  value text,
  unit text,
  observed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete restrict,
  name text,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  amount numeric,
  status text default 'pending',
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  access_type text,
  granted boolean not null default true,
  granted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table if exists public.organizations add column if not exists address text;
alter table if exists public.organizations alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.organizations alter column created_at set default now();
alter table if exists public.organizations alter column type type text using type::text;
alter table if exists public.organizations drop constraint if exists organizations_type_check;
alter table if exists public.organizations
  add constraint organizations_type_check check (type in ('hospital', 'clinic', 'insurance'));

alter table if exists public.providers add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
alter table if exists public.providers add column if not exists email text;
alter table if exists public.providers alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.providers alter column created_at set default now();

alter table if exists public.patients add column if not exists first_name text;
alter table if exists public.patients add column if not exists last_name text;
alter table if exists public.patients add column if not exists date_of_birth date;

update public.patients
set
  first_name = coalesce(first_name, split_part(name, ' ', 1)),
  last_name = coalesce(last_name, nullif(trim(regexp_replace(name, '^\\S+\\s*', '')), '')),
  date_of_birth = coalesce(date_of_birth, dob)
where (first_name is null or last_name is null or date_of_birth is null)
  and (name is not null or dob is not null);

alter table if exists public.patients drop column if exists name;
alter table if exists public.patients drop column if exists dob;
alter table if exists public.patients alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.patients alter column created_at set default now();
alter table if exists public.patients alter column gender type text using gender::text;

alter table if exists public.encounters add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
alter table if exists public.encounters add column if not exists visit_date timestamptz;
alter table if exists public.encounters add column if not exists notes text;

update public.encounters
set visit_date = coalesce(visit_date, date::timestamptz)
where visit_date is null
  and date is not null;

update public.encounters e
set organization_id = p.organization_id
from public.providers p
where e.organization_id is null
  and p.id = e.provider_id;

alter table if exists public.encounters drop column if exists date;
alter table if exists public.encounters drop column if exists source_system;
alter table if exists public.encounters alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.encounters alter column created_at set default now();

alter table if exists public.observations add column if not exists encounter_id uuid references public.encounters(id) on delete set null;
alter table if exists public.observations add column if not exists observed_at timestamptz;

update public.observations
set observed_at = coalesce(observed_at, date::timestamptz)
where observed_at is null
  and date is not null;

alter table if exists public.observations drop column if exists date;
alter table if exists public.observations drop column if exists source_system;
alter table if exists public.observations alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.observations alter column created_at set default now();

alter table if exists public.medications add column if not exists provider_id uuid references public.providers(id) on delete restrict;
alter table if exists public.medications add column if not exists frequency text;
alter table if exists public.medications add column if not exists start_date date;
alter table if exists public.medications add column if not exists end_date date;

update public.medications m
set provider_id = p.id
from public.providers p
where m.provider_id is null
  and p.name = m.prescribed_by;

update public.medications
set start_date = coalesce(start_date, created_at::date)
where start_date is null;

alter table if exists public.medications drop column if exists prescribed_by;
alter table if exists public.medications drop column if exists source_system;
alter table if exists public.medications alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.medications alter column created_at set default now();

alter table if exists public.claims add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
alter table if exists public.claims add column if not exists submitted_at timestamptz;
alter table if exists public.claims alter column status drop default;
alter table if exists public.claims alter column status type text using status::text;
alter table if exists public.claims alter column status set default 'pending';
alter table if exists public.claims alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.claims alter column created_at set default now();

update public.claims c
set organization_id = p.organization_id
from public.providers p
where c.organization_id is null
  and p.id = c.provider_id;

update public.claims
set submitted_at = coalesce(submitted_at, created_at)
where submitted_at is null;

alter table if exists public.claims drop constraint if exists claims_status_check;
alter table if exists public.claims
  add constraint claims_status_check check (status in ('pending', 'approved', 'rejected'));

alter table if exists public.consents add column if not exists granted_at timestamptz;
alter table if exists public.consents alter column access_type type text using access_type::text;
alter table if exists public.consents alter column created_at type timestamptz using created_at::timestamptz;
alter table if exists public.consents alter column created_at set default now();

update public.consents
set granted_at = coalesce(granted_at, created_at)
where granted_at is null;

alter table if exists public.consents alter column granted_at set default now();

-- Keep legacy policy/function integrations working after access_type moves to text.
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
      and (c.access_type = p_access_type::text or c.access_type = 'full')
  );
$$;

create unique index if not exists idx_providers_email_unique
  on public.providers (lower(email))
  where email is not null;

create index if not exists idx_providers_organization_id
  on public.providers (organization_id);
create index if not exists idx_patients_user_id
  on public.patients (user_id);
create index if not exists idx_encounters_patient_id
  on public.encounters (patient_id);
create index if not exists idx_encounters_provider_id
  on public.encounters (provider_id);
create index if not exists idx_encounters_organization_id
  on public.encounters (organization_id);
create index if not exists idx_encounters_visit_date
  on public.encounters (visit_date desc);
create index if not exists idx_observations_patient_id
  on public.observations (patient_id);
create index if not exists idx_observations_encounter_id
  on public.observations (encounter_id);
create index if not exists idx_observations_observed_at
  on public.observations (observed_at desc);
create index if not exists idx_medications_patient_id
  on public.medications (patient_id);
create index if not exists idx_medications_provider_id
  on public.medications (provider_id);
create index if not exists idx_medications_start_date
  on public.medications (start_date desc);
create index if not exists idx_claims_patient_id
  on public.claims (patient_id);
create index if not exists idx_claims_provider_id
  on public.claims (provider_id);
create index if not exists idx_claims_organization_id
  on public.claims (organization_id);
create index if not exists idx_claims_status
  on public.claims (status);
create index if not exists idx_claims_submitted_at
  on public.claims (submitted_at desc);
do $$
declare
  patient_attnum smallint;
  organization_attnum smallint;
  access_type_attnum smallint;
begin
  select attnum into patient_attnum
  from pg_attribute
  where attrelid = 'public.consents'::regclass
    and attname = 'patient_id'
    and not attisdropped;

  select attnum into organization_attnum
  from pg_attribute
  where attrelid = 'public.consents'::regclass
    and attname = 'organization_id'
    and not attisdropped;

  select attnum into access_type_attnum
  from pg_attribute
  where attrelid = 'public.consents'::regclass
    and attname = 'access_type'
    and not attisdropped;

  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.consents'::regclass
      and c.contype = 'u'
      and c.conkey = array[patient_attnum, organization_attnum, access_type_attnum]::int2[]
  ) then
    alter table public.consents
      add constraint consents_patient_org_access_key unique (patient_id, organization_id, access_type);
  end if;
end
$$;

alter table if exists public.organizations enable row level security;
alter table if exists public.providers enable row level security;
alter table if exists public.patients enable row level security;
alter table if exists public.encounters enable row level security;
alter table if exists public.observations enable row level security;
alter table if exists public.medications enable row level security;
alter table if exists public.claims enable row level security;
alter table if exists public.consents enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'organizations',
        'providers',
        'patients',
        'encounters',
        'observations',
        'medications',
        'claims',
        'consents'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

create policy organizations_read_authenticated
on public.organizations
for select
to authenticated
using (true);

create policy providers_read_authenticated
on public.providers
for select
to authenticated
using (true);

create policy patients_select_own
on public.patients
for select
to authenticated
using (user_id = auth.uid());

create policy encounters_select_patient_owned
on public.encounters
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = encounters.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy encounters_insert_provider
on public.encounters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.providers pr
    where pr.id = encounters.provider_id
      and pr.organization_id = encounters.organization_id
      and pr.email is not null
      and lower(pr.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create policy observations_select_patient_owned
on public.observations
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = observations.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy medications_select_patient_owned
on public.medications
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = medications.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy claims_select_patient_owned
on public.claims
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = claims.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy consents_select_patient_owned
on public.consents
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = consents.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy consents_insert_patient_owned
on public.consents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.patients pt
    where pt.id = consents.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy consents_update_patient_owned
on public.consents
for update
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = consents.patient_id
      and pt.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.patients pt
    where pt.id = consents.patient_id
      and pt.user_id = auth.uid()
  )
);

create policy consents_delete_patient_owned
on public.consents
for delete
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = consents.patient_id
      and pt.user_id = auth.uid()
  )
);
