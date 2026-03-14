/**
 * Mock/demo data for admin dashboard when API fails or returns empty.
 * Used for demos and development when database is not populated.
 */

import type { Alert, AnalyticsMetrics } from "@/types/ai";
import type { Database } from "@/types/database";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProviderRow = Database["public"]["Tables"]["providers"]["Row"];

const now = new Date().toISOString();
const pastDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_ORGANIZATIONS: OrganizationRow[] = [
  {
    id: "mock-org-1",
    name: "City General Hospital",
    type: "hospital",
    address: "123 Medical Center Dr, Health City",
    created_at: pastDate(90),
  },
  {
    id: "mock-org-2",
    name: "Sunrise Family Clinic",
    type: "clinic",
    address: "456 Wellness Ave, Suite 100",
    created_at: pastDate(60),
  },
  {
    id: "mock-org-3",
    name: "Metro Health Insurance",
    type: "insurance",
    address: "789 Coverage Blvd",
    created_at: pastDate(45),
  },
  {
    id: "mock-org-4",
    name: "Riverside Medical Center",
    type: "hospital",
    address: "321 River Road",
    created_at: pastDate(30),
  },
];

export const MOCK_PROFILES: ProfileRow[] = [
  {
    id: "mock-profile-1",
    email: "admin@healthbridge.demo",
    full_name: "Admin Demo",
    role: "admin",
    organization_id: null,
    created_at: pastDate(120),
  },
  {
    id: "mock-profile-2",
    email: "dr.smith@citygeneral.demo",
    full_name: "Dr. Sarah Smith",
    role: "provider",
    organization_id: "mock-org-1",
    created_at: pastDate(80),
  },
  {
    id: "mock-profile-3",
    email: "dr.johnson@sunrise.demo",
    full_name: "Dr. Michael Johnson",
    role: "provider",
    organization_id: "mock-org-2",
    created_at: pastDate(55),
  },
  {
    id: "mock-profile-4",
    email: "claims@metro.demo",
    full_name: "Jane Claims",
    role: "insurance",
    organization_id: "mock-org-3",
    created_at: pastDate(40),
  },
  {
    id: "mock-profile-5",
    email: "patient.demo@example.com",
    full_name: "John Patient",
    role: "patient",
    organization_id: null,
    created_at: pastDate(20),
  },
];

export const MOCK_PROVIDERS: ProviderRow[] = [
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
  {
    id: "mock-provider-3",
    name: "Dr. Emily Chen",
    specialty: "Cardiology",
    email: "dr.chen@citygeneral.demo",
    organization_id: "mock-org-1",
    user_id: null,
    created_at: pastDate(25),
  },
];

export const MOCK_ANALYTICS: AnalyticsMetrics = {
  total_patients: 1247,
  total_encounters: 3892,
  total_claims: 2156,
  average_risk_score: 5.2,
  high_risk_patients: 89,
  patients_by_risk_level: [
    { level: "low", count: 892 },
    { level: "medium", count: 266 },
    { level: "high", count: 89 },
  ],
};

export const MOCK_ALERTS: Alert[] = [
  {
    id: "mock-alert-1",
    alert_type: "elevated_risk_score",
    patient_id: "pt-001",
    message: "Patient risk score increased to 12. Recommend follow-up consultation.",
    severity: "high",
    created_at: pastDate(1),
  },
  {
    id: "mock-alert-2",
    alert_type: "abnormal_observation",
    patient_id: "pt-002",
    message: "Glucose reading above threshold (148 mg/dL). Consider diabetes screening.",
    severity: "medium",
    created_at: pastDate(2),
  },
  {
    id: "mock-alert-3",
    alert_type: "encounter_density",
    patient_id: "pt-003",
    message: "High encounter frequency in past 30 days. Review care coordination.",
    severity: "medium",
    created_at: pastDate(3),
  },
  {
    id: "mock-alert-4",
    alert_type: "medication_review",
    patient_id: "pt-004",
    message: "Multiple medication changes. Schedule medication reconciliation.",
    severity: "low",
    created_at: pastDate(5),
  },
];

export const MOCK_COUNTS = {
  organizations: MOCK_ORGANIZATIONS.length,
  patients: 1247,
  providers: MOCK_PROVIDERS.length,
  users: MOCK_PROFILES.length,
};

export const MOCK_ADMIN_OVERVIEW = {
  organizations: MOCK_ORGANIZATIONS,
  profiles: MOCK_PROFILES,
  providers: MOCK_PROVIDERS,
  analytics: MOCK_ANALYTICS,
  alerts: MOCK_ALERTS,
  counts: MOCK_COUNTS,
};
