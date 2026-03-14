/**
 * Mock/demo data for insurance dashboard when API fails or returns empty.
 */

import type { Claim, Patient, Provider } from "@/types/fhir";

const pastDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_INSURANCE_CLAIMS_ENRICHED = [
  {
    id: "mock-claim-1",
    amount: 450,
    created_at: pastDate(5),
    patient_id: "mock-pt-1",
    provider_id: "mock-provider-1",
    organization_id: "mock-org-3",
    status: "pending" as const,
    submitted_at: pastDate(5),
    patient_name: "John Smith",
    provider_name: "Dr. Sarah Smith",
    latestEncounter: {
      reason: "Annual checkup",
      diagnosis: "Routine physical - no significant findings",
      visit_date: pastDate(5),
    },
  },
  {
    id: "mock-claim-2",
    amount: 1200,
    created_at: pastDate(10),
    patient_id: "mock-pt-2",
    provider_id: "mock-provider-2",
    organization_id: "mock-org-3",
    status: "approved" as const,
    submitted_at: pastDate(12),
    patient_name: "Maria Garcia",
    provider_name: "Dr. Michael Johnson",
    latestEncounter: {
      reason: "Hypertension follow-up",
      diagnosis: "Essential hypertension - controlled",
      visit_date: pastDate(12),
    },
  },
  {
    id: "mock-claim-3",
    amount: 85,
    created_at: pastDate(2),
    patient_id: "mock-pt-3",
    provider_id: "mock-provider-1",
    organization_id: "mock-org-3",
    status: "pending" as const,
    submitted_at: pastDate(2),
    patient_name: "Robert Chen",
    provider_name: "Dr. Sarah Smith",
    latestEncounter: {
      reason: "Lab results review",
      diagnosis: "Type 2 diabetes - stable",
      visit_date: pastDate(2),
    },
  },
];

export const MOCK_CLAIMS: Claim[] = [
  {
    id: "mock-claim-1",
    amount: 450,
    created_at: pastDate(5),
    patient_id: "mock-pt-1",
    provider_id: "mock-provider-1",
    organization_id: "mock-org-3",
    status: "pending",
    submitted_at: pastDate(5),
  },
  {
    id: "mock-claim-2",
    amount: 1200,
    created_at: pastDate(10),
    patient_id: "mock-pt-2",
    provider_id: "mock-provider-2",
    organization_id: "mock-org-3",
    status: "approved",
    submitted_at: pastDate(12),
  },
  {
    id: "mock-claim-3",
    amount: 85,
    created_at: pastDate(2),
    patient_id: "mock-pt-3",
    provider_id: "mock-provider-1",
    organization_id: "mock-org-3",
    status: "pending",
    submitted_at: pastDate(2),
  },
];

export const MOCK_PATIENTS_FOR_CLAIMS: Patient[] = [
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

export const MOCK_PROVIDERS_FOR_CLAIMS: Provider[] = [
  {
    id: "mock-provider-1",
    name: "Dr. Sarah Smith",
    specialty: "Internal Medicine",
    email: "dr.smith@citygeneral.demo",
    organization_id: "mock-org-1",
    user_id: "mock-profile-2",
    created_at: pastDate(80),
  },
  {
    id: "mock-provider-2",
    name: "Dr. Michael Johnson",
    specialty: "Family Medicine",
    email: "dr.johnson@sunrise.demo",
    organization_id: "mock-org-2",
    user_id: "mock-profile-3",
    created_at: pastDate(55),
  },
];
