create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  alert_type text not null,
  message text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create index if not exists alerts_patient_id_idx on public.alerts (patient_id);
create index if not exists alerts_created_at_idx on public.alerts (created_at desc);
