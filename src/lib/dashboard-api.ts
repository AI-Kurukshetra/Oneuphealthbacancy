import { z } from "zod";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Alert, AnalyticsMetrics, RiskScore } from "@/types/ai";
import type { Database, ProfileRole } from "@/types/database";
import type { Claim, Consent, Encounter, Medication, Observation, Patient, Provider } from "@/types/fhir";

const profileSchema = z.object({
  created_at: z.string(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  id: z.string(),
  organization_id: z.string().nullable(),
  role: z.enum(["patient", "provider", "insurance", "admin"]),
});

const organizationSchema = z.object({
  address: z.string().nullable(),
  created_at: z.string(),
  id: z.string(),
  name: z.string(),
  type: z.enum(["hospital", "clinic", "insurance"]),
});

type ApiEnvelope<T> = {
  data: T;
  success: true;
} | {
  error: string;
  success: false;
};

export type DashboardSession = {
  organization: Database["public"]["Tables"]["organizations"]["Row"] | null;
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  user: {
    email: string | null | undefined;
    id: string;
  };
};

async function getAccessToken() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? "";
}

export async function getDashboardSession() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id, full_name, email, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !rawProfile) {
    throw new Error(profileError?.message ?? "Profile not found.");
  }

  const profile = profileSchema.parse(rawProfile);
  let organization: DashboardSession["organization"] = null;

  if (profile.organization_id) {
    const { data: rawOrganization } = await supabase
      .from("organizations")
      .select("id, name, type, address, created_at")
      .eq("id", profile.organization_id)
      .maybeSingle();

    organization = rawOrganization ? organizationSchema.parse(rawOrganization) : null;
  }

  return {
    organization,
    profile,
    user: {
      email: user.email,
      id: user.id,
    },
  } satisfies DashboardSession;
}

export async function signOutDashboardUser() {
  const supabase = createBrowserSupabaseClient();
  await supabase.auth.signOut();
}

export async function fetchApi<T>(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload && "error" in payload ? payload.error : "Request failed.");
  }

  return payload.data;
}

export async function fetchPatients() {
  return await fetchApi<Patient[]>("/api/patients");
}

export async function fetchPatient(patientId: string) {
  return await fetchApi<Patient>(`/api/patients/${patientId}`);
}

export async function fetchProviders() {
  return await fetchApi<Provider[]>("/api/providers");
}

export async function fetchProvider(providerId: string) {
  return await fetchApi<Provider>(`/api/providers/${providerId}`);
}

export async function fetchPatientEncounters(patientId: string) {
  return await fetchApi<Encounter[]>(`/api/patients/${patientId}/encounters`);
}

export async function fetchPatientObservations(patientId: string) {
  return await fetchApi<Observation[]>(`/api/patients/${patientId}/observations`);
}

export async function fetchPatientMedications(patientId: string) {
  return await fetchApi<Medication[]>(`/api/patients/${patientId}/medications`);
}

export async function fetchPatientClaims(patientId: string) {
  return await fetchApi<Claim[]>(`/api/patients/${patientId}/claims`);
}

export async function fetchClaims() {
  return await fetchApi<Claim[]>("/api/claims");
}

export async function fetchConsentRecords(patientId: string) {
  return await fetchApi<Consent[]>(`/api/consent/${patientId}`);
}

export async function fetchAiSummary(patientId: string) {
  return await fetchApi<{ summary: string }>("/api/ai/summary", {
    body: JSON.stringify({ patient_id: patientId }),
    method: "POST",
  });
}

export async function fetchRiskScore(patientId: string) {
  return await fetchApi<RiskScore>(`/api/ai/risk/${patientId}`);
}

export async function fetchAlerts(patientId?: string) {
  const search = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  return await fetchApi<Alert[]>(`/api/alerts${search}`);
}

export async function fetchPopulationAnalytics() {
  return await fetchApi<AnalyticsMetrics>("/api/analytics/population");
}

export async function createEncounter(payload: Partial<Encounter>) {
  return await fetchApi<Encounter>("/api/encounters", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function createObservation(payload: Partial<Observation>) {
  return await fetchApi<Observation>("/api/observations", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function createMedication(payload: Partial<Medication>) {
  return await fetchApi<Medication>("/api/medications", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function updateClaimStatus(claimId: string, status: Claim["status"]) {
  return await fetchApi<Claim>(`/api/claims/${claimId}`, {
    body: JSON.stringify({ status }),
    method: "PUT",
  });
}

export async function grantConsent(payload: Pick<Consent, "access_type" | "organization_id" | "patient_id">) {
  return await fetchApi<Consent>("/api/consent/grant", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function revokeConsent(payload: Pick<Consent, "access_type" | "organization_id" | "patient_id">) {
  return await fetchApi<Consent>("/api/consent/revoke", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function fetchOrganizations() {
  return await fetchApi<Database["public"]["Tables"]["organizations"]["Row"][]>("/api/admin/organizations");
}

export function rolePath(role: ProfileRole) {
  switch (role) {
    case "patient":
      return "/dashboard/patient";
    case "provider":
      return "/dashboard/provider";
    case "insurance":
      return "/dashboard/insurance";
    case "admin":
    default:
      return "/dashboard/admin/monitor";
  }
}
