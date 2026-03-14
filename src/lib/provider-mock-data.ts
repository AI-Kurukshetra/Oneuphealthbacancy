/**
 * Mock/demo data for provider dashboard when API fails or returns empty.
 */

import type { Encounter, Medication, Observation, Patient, Provider } from "@/types/fhir";

const pastDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_PROVIDER: Provider = {
  id: "mock-provider-1",
  name: "Dr. Sarah Smith",
  specialty: "Internal Medicine",
  email: "dr.smith@citygeneral.demo",
  organization_id: "mock-org-1",
  user_id: "mock-user-1",
  created_at: pastDate(80),
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "mock-pt-1",
    first_name: "John",
    last_name: "Smith",
    date_of_birth: "1985-03-15",
    gender: "male",
    phone: "+1-555-0101",
    address: "123 Main St",
    user_id: null,
    created_at: pastDate(90),
  },
  {
    id: "mock-pt-2",
    first_name: "Maria",
    last_name: "Garcia",
    date_of_birth: "1978-07-22",
    gender: "female",
    phone: "+1-555-0102",
    address: "456 Oak Ave",
    user_id: null,
    created_at: pastDate(80),
  },
  {
    id: "mock-pt-3",
    first_name: "Robert",
    last_name: "Chen",
    date_of_birth: "1992-11-08",
    gender: "male",
    phone: "+1-555-0103",
    address: "789 Pine Rd",
    user_id: null,
    created_at: pastDate(60),
  },
];

export const MOCK_PROVIDERS: Provider[] = [
  MOCK_PROVIDER,
  {
    id: "mock-provider-2",
    name: "Dr. Michael Johnson",
    specialty: "Family Medicine",
    email: "dr.johnson@sunrise.demo",
    organization_id: "mock-org-2",
    user_id: "mock-user-2",
    created_at: pastDate(55),
  },
];

export const MOCK_ENCOUNTERS: Encounter[] = [
  {
    id: "mock-enc-1",
    patient_id: "mock-pt-1",
    provider_id: "mock-provider-1",
    organization_id: "mock-org-1",
    visit_date: pastDate(5),
    reason: "Annual checkup",
    diagnosis: "Routine physical - no significant findings",
    notes: "Patient in good health. Recommended continued exercise.",
    created_at: pastDate(5),
  },
  {
    id: "mock-enc-2",
    patient_id: "mock-pt-1",
    provider_id: "mock-provider-1",
    organization_id: "mock-org-1",
    visit_date: pastDate(30),
    reason: "Flu symptoms",
    diagnosis: "Seasonal influenza",
    notes: "Prescribed rest and OTC medications.",
    created_at: pastDate(30),
  },
];

export const MOCK_OBSERVATIONS: Observation[] = [
  {
    id: "mock-obs-1",
    patient_id: "mock-pt-1",
    encounter_id: "mock-enc-1",
    type: "Blood pressure",
    value: "120/80",
    unit: "mmHg",
    observed_at: pastDate(5),
    created_at: pastDate(5),
  },
  {
    id: "mock-obs-2",
    patient_id: "mock-pt-1",
    encounter_id: "mock-enc-1",
    type: "Glucose",
    value: "95",
    unit: "mg/dL",
    observed_at: pastDate(5),
    created_at: pastDate(5),
  },
];

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: "mock-med-1",
    patient_id: "mock-pt-1",
    provider_id: "mock-provider-1",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    start_date: pastDate(60),
    end_date: null,
    created_at: pastDate(60),
  },
  {
    id: "mock-med-2",
    patient_id: "mock-pt-1",
    provider_id: "mock-provider-1",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    start_date: pastDate(90),
    end_date: null,
    created_at: pastDate(90),
  },
];
