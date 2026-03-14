# HealthBridge

Unified Healthcare Data Exchange Platform demo built with Next.js + Supabase.

## What this demo shows

- Patient data from multiple providers (`source_system` on encounters/observations/medications/documents)
- Aggregated patient profile (patient + encounters + observations + claims + consents)
- Patient-controlled consent (grant/revoke by organization + access type)
- FHIR-style REST APIs (Bundle responses for core resources)

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn-style primitives
- Supabase PostgreSQL + Auth + Storage + Realtime

## Roles

- `patient`: view own records, grant/revoke consent, upload documents
- `provider`: create patients/encounters/observations/claims
- `insurance`: create claims, view records if consent exists
- `admin`: full access

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3. Apply Supabase migrations and seed before using auth or dashboards

```bash
supabase db reset
```

If you are applying SQL manually, run the migration files in order:

```text
supabase/migrations/0001_healthbridge_schema.sql
supabase/migrations/0002_profiles.sql
supabase/migrations/0003_healthbridge_core_schema_alignment.sql
supabase/migrations/0004_role_dashboard_alignment.sql
supabase/seed/demo_seed.sql
```

If you skip this step, registration and admin user creation will fail with errors like `relation "public.profiles" does not exist`.

4. Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## API endpoints (FHIR-style)

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`

### Patients

- `GET /api/patients`
- `GET /api/patients/:id`
- `POST /api/patients`

### Encounters

- `POST /api/encounters`
- `GET /api/patients/:id/encounters`

### Observations

- `POST /api/observations`
- `GET /api/patients/:id/observations`

### Claims

- `POST /api/claims`
- `GET /api/patients/:id/claims`

### Consent

- `POST /api/consent/grant`
- `POST /api/consent/revoke`
- `GET /api/consent/:patientId`

### Documents

- `GET /api/documents?patient_id=:id`
- `POST /api/documents` (base64 payload upload to `health-reports` bucket)

## Database entities

- `patients`
- `providers`
- `organizations`
- `encounters`
- `observations`
- `medications`
- `claims`
- `consents`
- `documents`
- `profiles` (role mapping for auth users)

## Notes

- Access checks are consent-aware (`user_has_active_consent` SQL function).
- Realtime subscriptions refresh dashboard/profile when records change.
- Seed file contains sample organizations, providers, patient, and multi-source records for demo.
