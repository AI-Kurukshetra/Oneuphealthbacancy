begin;

insert into public.organizations (id, name, type, address, created_at)
values
  ('10000000-0000-0000-0000-000000000001', 'City Hospital', 'hospital', '123 Main Street, Springfield, IL 62701', '2026-01-01T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'MedCare Clinic', 'clinic', '456 Oak Avenue, Springfield, IL 62703', '2026-01-01T08:05:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'HealthSecure Insurance', 'insurance', '789 Market Boulevard, Springfield, IL 62704', '2026-01-01T08:10:00Z')
on conflict (id) do update
set
  name = excluded.name,
  type = excluded.type,
  address = excluded.address,
  created_at = excluded.created_at;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:00:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Platform Admin","role":"admin"}',
    false,
    '2026-01-01T09:00:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'payer@healthsecure.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:05:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"HealthSecure Analyst","role":"insurance","organization_id":"10000000-0000-0000-0000-000000000003"}',
    false,
    '2026-01-01T09:05:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'sarah.johnson@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:10:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Sarah Johnson","role":"provider","organization_id":"10000000-0000-0000-0000-000000000001"}',
    false,
    '2026-01-01T09:10:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000102',
    'authenticated',
    'authenticated',
    'michael.lee@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:15:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Michael Lee","role":"provider","organization_id":"10000000-0000-0000-0000-000000000002"}',
    false,
    '2026-01-01T09:15:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000103',
    'authenticated',
    'authenticated',
    'anita.patel@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:20:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Anita Patel","role":"provider","organization_id":"10000000-0000-0000-0000-000000000001"}',
    false,
    '2026-01-01T09:20:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000104',
    'authenticated',
    'authenticated',
    'david.kim@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:25:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. David Kim","role":"provider","organization_id":"10000000-0000-0000-0000-000000000002"}',
    false,
    '2026-01-01T09:25:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000201',
    'authenticated',
    'authenticated',
    'emma.rodriguez@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:30:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Emma Rodriguez","role":"patient"}',
    false,
    '2026-01-01T09:30:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000202',
    'authenticated',
    'authenticated',
    'james.walker@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:35:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"James Walker","role":"patient"}',
    false,
    '2026-01-01T09:35:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000203',
    'authenticated',
    'authenticated',
    'olivia.chen@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:40:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Olivia Chen","role":"patient"}',
    false,
    '2026-01-01T09:40:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000204',
    'authenticated',
    'authenticated',
    'noah.thompson@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:45:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Noah Thompson","role":"patient"}',
    false,
    '2026-01-01T09:45:00Z',
    '2026-03-14T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000205',
    'authenticated',
    'authenticated',
    'sophia.martinez@healthbridge.demo',
    crypt('DemoPass#2026', gen_salt('bf')),
    '2026-01-01T09:50:00Z',
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    '2026-03-14T08:30:00Z',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sophia Martinez","role":"patient"}',
    false,
    '2026-01-01T09:50:00Z',
    '2026-03-14T08:30:00Z'
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.profiles (id, email, full_name, role, organization_id, created_at)
values
  ('90000000-0000-0000-0000-000000000001', 'admin@healthbridge.demo', 'Platform Admin', 'admin', null, '2026-01-01T09:00:00Z'),
  ('90000000-0000-0000-0000-000000000002', 'payer@healthsecure.demo', 'HealthSecure Analyst', 'insurance', '10000000-0000-0000-0000-000000000003', '2026-01-01T09:05:00Z'),
  ('90000000-0000-0000-0000-000000000101', 'sarah.johnson@healthbridge.demo', 'Dr. Sarah Johnson', 'provider', '10000000-0000-0000-0000-000000000001', '2026-01-01T09:10:00Z'),
  ('90000000-0000-0000-0000-000000000102', 'michael.lee@healthbridge.demo', 'Dr. Michael Lee', 'provider', '10000000-0000-0000-0000-000000000002', '2026-01-01T09:15:00Z'),
  ('90000000-0000-0000-0000-000000000103', 'anita.patel@healthbridge.demo', 'Dr. Anita Patel', 'provider', '10000000-0000-0000-0000-000000000001', '2026-01-01T09:20:00Z'),
  ('90000000-0000-0000-0000-000000000104', 'david.kim@healthbridge.demo', 'Dr. David Kim', 'provider', '10000000-0000-0000-0000-000000000002', '2026-01-01T09:25:00Z'),
  ('90000000-0000-0000-0000-000000000201', 'emma.rodriguez@healthbridge.demo', 'Emma Rodriguez', 'patient', null, '2026-01-01T09:30:00Z'),
  ('90000000-0000-0000-0000-000000000202', 'james.walker@healthbridge.demo', 'James Walker', 'patient', null, '2026-01-01T09:35:00Z'),
  ('90000000-0000-0000-0000-000000000203', 'olivia.chen@healthbridge.demo', 'Olivia Chen', 'patient', null, '2026-01-01T09:40:00Z'),
  ('90000000-0000-0000-0000-000000000204', 'noah.thompson@healthbridge.demo', 'Noah Thompson', 'patient', null, '2026-01-01T09:45:00Z'),
  ('90000000-0000-0000-0000-000000000205', 'sophia.martinez@healthbridge.demo', 'Sophia Martinez', 'patient', null, '2026-01-01T09:50:00Z')
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  organization_id = excluded.organization_id,
  created_at = excluded.created_at;

insert into public.providers (id, user_id, organization_id, name, specialty, email, created_at)
values
  ('20000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'Dr. Sarah Johnson', 'Cardiologist', 'sarah.johnson@healthbridge.demo', '2026-01-02T08:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000002', 'Dr. Michael Lee', 'General Physician', 'michael.lee@healthbridge.demo', '2026-01-02T08:05:00Z'),
  ('20000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', 'Dr. Anita Patel', 'Endocrinologist', 'anita.patel@healthbridge.demo', '2026-01-02T08:10:00Z'),
  ('20000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000002', 'Dr. David Kim', 'Neurologist', 'david.kim@healthbridge.demo', '2026-01-02T08:15:00Z')
on conflict (id) do update
set
  user_id = excluded.user_id,
  organization_id = excluded.organization_id,
  name = excluded.name,
  specialty = excluded.specialty,
  email = excluded.email,
  created_at = excluded.created_at;

insert into public.patients (id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at)
values
  ('30000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000201', 'Emma', 'Rodriguez', '1984-05-14', 'female', '(217) 555-0101', '742 Evergreen Terrace, Springfield, IL 62701', '2026-01-03T08:00:00Z'),
  ('30000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000202', 'James', 'Walker', '1978-11-02', 'male', '(217) 555-0102', '18 River Road, Springfield, IL 62702', '2026-01-03T08:05:00Z'),
  ('30000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000203', 'Olivia', 'Chen', '1991-08-23', 'female', '(217) 555-0103', '220 Pine Street, Springfield, IL 62703', '2026-01-03T08:10:00Z'),
  ('30000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000204', 'Noah', 'Thompson', '2002-01-17', 'male', '(217) 555-0104', '91 Lakeview Drive, Springfield, IL 62704', '2026-01-03T08:15:00Z'),
  ('30000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000205', 'Sophia', 'Martinez', '1969-09-30', 'female', '(217) 555-0105', '310 Cedar Lane, Springfield, IL 62711', '2026-01-03T08:20:00Z')
on conflict (id) do update
set
  user_id = excluded.user_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  phone = excluded.phone,
  address = excluded.address,
  created_at = excluded.created_at;

insert into public.encounters (id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-01-15T09:00:00Z', 'Cardiology follow-up for elevated blood pressure', 'Hypertension', 'Patient reports intermittent headaches and elevated home blood pressure readings over the last two weeks.', '2026-01-15T09:30:00Z'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '2026-02-20T11:00:00Z', 'Endocrinology follow-up for diabetes management', 'Type 2 Diabetes', 'Fasting glucose remains elevated. Diet counseling and medication adherence reviewed.', '2026-02-20T11:30:00Z'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '2026-01-22T10:15:00Z', 'Visit for wheezing, cough, and shortness of breath', 'Asthma', 'Rescue inhaler use increased during recent cold weather. No hospitalization required.', '2026-01-22T10:45:00Z'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-03-04T14:00:00Z', 'Evaluation of chest pressure and elevated blood pressure', 'Hypertension', 'EKG normal. Blood pressure elevated in clinic. Lifestyle counseling provided.', '2026-03-04T14:30:00Z'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '2026-02-11T09:20:00Z', 'Primary care visit for persistent headaches', 'Migraine', 'Migraine symptoms occurring weekly with light sensitivity and nausea.', '2026-02-11T09:50:00Z'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '2026-03-01T13:00:00Z', 'Neurology follow-up for migraine control', 'Migraine', 'Patient reports partial relief with current therapy but still has breakthrough episodes.', '2026-03-01T13:25:00Z'),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '2026-01-29T08:45:00Z', 'Routine wellness check and asthma history review', 'Asthma', 'Symptoms are mild and well controlled. Encouraged regular exercise and annual spirometry.', '2026-01-29T09:05:00Z'),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '2026-03-10T15:15:00Z', 'Fatigue evaluation with concern for elevated glucose', 'Type 2 Diabetes', 'Borderline elevated glucose reviewed. Additional monitoring recommended due to family history.', '2026-03-10T15:40:00Z'),
  ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-02-05T10:30:00Z', 'Blood pressure and lipid follow-up', 'Hypertension', 'Blood pressure remains above goal. Cholesterol results reviewed and statin continued.', '2026-02-05T11:00:00Z'),
  ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '2026-03-12T16:00:00Z', 'Neurology visit for dizziness and recurrent headaches', 'Migraine', 'No focal deficits seen. Hydration and migraine trigger tracking reviewed.', '2026-03-12T16:30:00Z')
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  provider_id = excluded.provider_id,
  organization_id = excluded.organization_id,
  visit_date = excluded.visit_date,
  reason = excluded.reason,
  diagnosis = excluded.diagnosis,
  notes = excluded.notes,
  created_at = excluded.created_at;

insert into public.observations (id, patient_id, encounter_id, type, value, unit, observed_at, created_at)
values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Blood Pressure Systolic', '148', 'mmHg', '2026-01-15T09:05:00Z', '2026-01-15T09:05:00Z'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Blood Pressure Diastolic', '92', 'mmHg', '2026-01-15T09:05:00Z', '2026-01-15T09:05:00Z'),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Blood Glucose', '182', 'mg/dL', '2026-02-20T11:05:00Z', '2026-02-20T11:05:00Z'),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Hemoglobin A1c', '7.8', '%', '2026-02-20T11:06:00Z', '2026-02-20T11:06:00Z'),
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', 'Oxygen Saturation', '95', '%', '2026-01-22T10:20:00Z', '2026-01-22T10:20:00Z'),
  ('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004', 'Blood Pressure Systolic', '142', 'mmHg', '2026-03-04T14:05:00Z', '2026-03-04T14:05:00Z'),
  ('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000005', 'Heart Rate', '78', 'bpm', '2026-02-11T09:25:00Z', '2026-02-11T09:25:00Z'),
  ('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000005', 'Blood Pressure Systolic', '126', 'mmHg', '2026-02-11T09:26:00Z', '2026-02-11T09:26:00Z'),
  ('50000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', 'Heart Rate', '88', 'bpm', '2026-03-01T13:05:00Z', '2026-03-01T13:05:00Z'),
  ('50000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000008', 'Blood Glucose', '118', 'mg/dL', '2026-03-10T15:20:00Z', '2026-03-10T15:20:00Z'),
  ('50000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000009', 'Cholesterol', '238', 'mg/dL', '2026-02-05T10:35:00Z', '2026-02-05T10:35:00Z'),
  ('50000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000009', 'Blood Pressure Systolic', '154', 'mmHg', '2026-02-05T10:36:00Z', '2026-02-05T10:36:00Z')
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  encounter_id = excluded.encounter_id,
  type = excluded.type,
  value = excluded.value,
  unit = excluded.unit,
  observed_at = excluded.observed_at,
  created_at = excluded.created_at;

insert into public.medications (id, patient_id, provider_id, name, dosage, frequency, start_date, end_date, created_at)
values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Metformin', '500 mg', 'Twice daily', '2026-02-20', null, '2026-02-20T11:15:00Z'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Lisinopril', '10 mg', 'Once daily', '2026-01-15', null, '2026-01-15T09:20:00Z'),
  ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Albuterol Inhaler', '2 puffs', 'Every 6 hours as needed', '2026-01-22', null, '2026-01-22T10:40:00Z'),
  ('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Aspirin', '81 mg', 'Once daily', '2026-03-04', null, '2026-03-04T14:20:00Z'),
  ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 'Sumatriptan', '50 mg', 'As needed for migraine', '2026-03-01', null, '2026-03-01T13:20:00Z'),
  ('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Montelukast', '10 mg', 'Once nightly', '2026-01-29', null, '2026-01-29T09:00:00Z'),
  ('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Atorvastatin', '20 mg', 'Once nightly', '2026-02-05', null, '2026-02-05T10:50:00Z'),
  ('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Lisinopril', '20 mg', 'Once daily', '2026-02-05', null, '2026-02-05T10:52:00Z')
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  provider_id = excluded.provider_id,
  name = excluded.name,
  dosage = excluded.dosage,
  frequency = excluded.frequency,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  created_at = excluded.created_at;

insert into public.claims (id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at)
values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 1240.00, 'approved', '2026-01-16T12:00:00Z', '2026-01-16T12:00:00Z'),
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 980.00, 'pending', '2026-02-21T12:30:00Z', '2026-02-21T12:30:00Z'),
  ('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 640.00, 'approved', '2026-01-23T11:15:00Z', '2026-01-23T11:15:00Z'),
  ('70000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 810.00, 'rejected', '2026-03-02T14:10:00Z', '2026-03-02T14:10:00Z'),
  ('70000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 520.00, 'pending', '2026-03-11T10:20:00Z', '2026-03-11T10:20:00Z'),
  ('70000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 1460.00, 'approved', '2026-02-06T13:00:00Z', '2026-02-06T13:00:00Z')
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  provider_id = excluded.provider_id,
  organization_id = excluded.organization_id,
  amount = excluded.amount,
  status = excluded.status,
  submitted_at = excluded.submitted_at,
  created_at = excluded.created_at;

insert into public.consents (id, patient_id, organization_id, access_type, granted, granted_at, created_at)
values
  ('80000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'claims', true, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
  ('80000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'clinical', true, '2026-01-10T09:05:00Z', '2026-01-10T09:05:00Z'),
  ('80000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'claims', true, '2026-01-18T10:00:00Z', '2026-01-18T10:00:00Z'),
  ('80000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'clinical', true, '2026-02-01T11:00:00Z', '2026-02-01T11:00:00Z'),
  ('80000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'claims', true, '2026-03-05T08:30:00Z', '2026-03-05T08:30:00Z'),
  ('80000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'full', true, '2026-02-02T12:00:00Z', '2026-02-02T12:00:00Z')
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  organization_id = excluded.organization_id,
  access_type = excluded.access_type,
  granted = excluded.granted,
  granted_at = excluded.granted_at,
  created_at = excluded.created_at;

insert into public.alerts (id, patient_id, alert_type, message, severity, created_at)
values
  ('85000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'high_blood_pressure', 'High blood pressure detected during cardiology follow-up with systolic pressure of 148 mmHg and diastolic pressure of 92 mmHg.', 'high', '2026-01-15T09:10:00Z'),
  ('85000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'elevated_glucose', 'Elevated glucose levels recorded at 182 mg/dL with hemoglobin A1c of 7.8 percent.', 'high', '2026-02-20T11:10:00Z'),
  ('85000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'multiple_recent_encounters', 'Multiple recent encounters suggest ongoing cardiopulmonary monitoring is needed.', 'medium', '2026-03-04T15:00:00Z'),
  ('85000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', 'high_risk_score_warning', 'High risk score warning generated due to uncontrolled hypertension, elevated cholesterol, and repeated follow-up needs.', 'high', '2026-02-05T11:10:00Z'),
  ('85000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'cholesterol_follow_up', 'Cholesterol remains elevated at 238 mg/dL. Continue statin therapy and repeat lipid panel in 3 months.', 'medium', '2026-02-05T11:15:00Z')
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  alert_type = excluded.alert_type,
  message = excluded.message,
  severity = excluded.severity,
  created_at = excluded.created_at;

commit;
