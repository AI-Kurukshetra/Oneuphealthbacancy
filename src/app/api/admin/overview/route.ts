import { requireApiRole } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/lib/api/fhir";
import { MOCK_ADMIN_OVERVIEW } from "@/lib/admin-mock-data";

async function fetchWithFallback<T>(
  url: string,
  authHeader: string,
  fallback: T,
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: { authorization: authHeader },
    });
    const payload = (await response.json().catch(() => null)) as
      | { data?: T; error?: string; success?: boolean }
      | null;

    if (response.ok && payload?.success && payload.data != null) {
      return payload.data as T;
    }
  } catch {
    // Fall through to fallback
  }
  return fallback;
}

export async function GET(request: Request) {
  const auth = await requireApiRole(["admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = createAdminSupabaseClient();
  const authHeader = request.headers.get("authorization") ?? "";
  const baseUrl = new URL(request.url).origin;

  const [
    organizationsResult,
    profilesResult,
    providersResult,
    patientsCountResult,
    analyticsResult,
    alertsResult,
  ] = await Promise.all([
    adminSupabase
      .from("organizations")
      .select("id, name, type, address, created_at")
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("profiles")
      .select("id, email, full_name, role, organization_id, created_at")
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("providers")
      .select("id, name, specialty, email, organization_id, user_id, created_at")
      .order("created_at", { ascending: false }),
    adminSupabase.from("patients").select("id", { count: "exact", head: true }),
    fetchWithFallback(
      `${baseUrl}/api/analytics/population`,
      authHeader,
      MOCK_ADMIN_OVERVIEW.analytics,
    ),
    fetchWithFallback(
      `${baseUrl}/api/alerts`,
      authHeader,
      MOCK_ADMIN_OVERVIEW.alerts,
    ),
  ]);

  if (organizationsResult.error) {
    return errorResponse(organizationsResult.error.message, 500);
  }
  if (profilesResult.error) {
    return errorResponse(profilesResult.error.message, 500);
  }
  if (providersResult.error) {
    return errorResponse(providersResult.error.message, 500);
  }
  if (patientsCountResult.error) {
    return errorResponse(patientsCountResult.error.message, 500);
  }

  const organizations = organizationsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const providers = providersResult.data ?? [];
  const patientsCount = patientsCountResult.count ?? 0;

  return successResponse({
    alerts: Array.isArray(alertsResult) ? alertsResult : MOCK_ADMIN_OVERVIEW.alerts,
    analytics: analyticsResult,
    counts: {
      organizations: organizations.length,
      patients: patientsCount,
      providers: providers.length,
      users: profiles.length,
    },
    organizations,
    profiles,
    providers,
  });
}
