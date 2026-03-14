-- Demo organizations
insert into public.organizations (id, name, type, address)
values
  ('11111111-1111-1111-1111-111111111111', 'North Valley Hospital', 'hospital', '100 Medical Plaza, Austin, TX'),
  ('22222222-2222-2222-2222-222222222222', 'CareFirst Clinic', 'clinic', '800 Wellness Blvd, Austin, TX'),
  ('33333333-3333-3333-3333-333333333333', 'WellSure Insurance', 'insurance', '50 Coverage Way, Austin, TX')
on conflict (id) do nothing;

-- Demo profiles use fixed UUIDs for hackathon demos.
insert into public.profiles (id, role, organization_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'patient', null),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'provider', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'provider', '22222222-2222-2222-2222-222222222222'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'insurance', '33333333-3333-3333-3333-333333333333')
on conflict (id) do nothing;

insert into public.patients (id, user_id, first_name, last_name, date_of_birth, gender, phone, address)
values
  ('f1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Olivia', 'Carter', '1992-06-14', 'female', '+1-555-100-2000', '741 Pine Ave, Austin, TX')
on conflict (id) do nothing;

insert into public.providers (id, name, organization_id, specialty, email)
values
  ('f2222222-2222-2222-2222-222222222222', 'Dr. Daniel Singh', '11111111-1111-1111-1111-111111111111', 'Cardiology', 'provider.hospital@healthbridge.dev'),
  ('f3333333-3333-3333-3333-333333333333', 'Dr. Amina Clark', '22222222-2222-2222-2222-222222222222', 'Endocrinology', 'provider.clinic@healthbridge.dev')
on conflict (id) do nothing;

insert into public.encounters (id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes)
values
  ('f4444444-4444-4444-4444-444444444441', 'f1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-01-10T10:00:00Z', 'Shortness of breath', 'Mild hypertension', 'Follow-up in 4 weeks.'),
  ('f4444444-4444-4444-4444-444444444442', 'f1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2026-02-19T14:30:00Z', 'Routine diabetes follow-up', 'Type 2 diabetes', 'Continue diet and exercise plan.')
on conflict (id) do nothing;

insert into public.observations (id, patient_id, encounter_id, type, value, unit, observed_at)
values
  ('f5555555-5555-5555-5555-555555555551', 'f1111111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444442', 'HbA1c', '7.3', '%', '2026-02-19T15:00:00Z'),
  ('f5555555-5555-5555-5555-555555555552', 'f1111111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444441', 'Blood Pressure Systolic', '138', 'mmHg', '2026-01-10T10:15:00Z')
on conflict (id) do nothing;

insert into public.medications (id, patient_id, provider_id, name, dosage, frequency, start_date, end_date)
values
  ('f6666666-6666-6666-6666-666666666661', 'f1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'Metformin', '500mg', 'twice daily', '2026-02-19', null),
  ('f6666666-6666-6666-6666-666666666662', 'f1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'Lisinopril', '10mg', 'once daily', '2026-01-10', null)
on conflict (id) do nothing;

insert into public.claims (id, patient_id, provider_id, organization_id, amount, status, submitted_at)
values
  ('f7777777-7777-7777-7777-777777777771', 'f1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 840.00, 'approved', '2026-01-12T08:00:00Z'),
  ('f7777777-7777-7777-7777-777777777772', 'f1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 320.00, 'pending', '2026-02-20T09:00:00Z')
on conflict (id) do nothing;

insert into public.consents (id, patient_id, organization_id, access_type, granted, granted_at)
values
  ('f8888888-8888-8888-8888-888888888881', 'f1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'claims', true, '2026-01-01T00:00:00Z'),
  ('f8888888-8888-8888-8888-888888888882', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'clinical', true, '2026-01-01T00:00:00Z'),
  ('f8888888-8888-8888-8888-888888888883', 'f1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'clinical', true, '2026-01-01T00:00:00Z')
on conflict (patient_id, organization_id, access_type) do update
set granted = excluded.granted,
    granted_at = excluded.granted_at;
