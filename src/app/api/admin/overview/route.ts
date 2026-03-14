import { requireApiRole } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/lib/api/fhir";

export async function GET(request: Request) {
  const auth = await requireApiRole(["admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = createAdminSupabaseClient();

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
    fetch(new URL("/api/analytics/population", request.url), {
      headers: {
        authorization: request.headers.get("authorization") ?? "",
      },
    }).then(async (response) => {
      const payload = (await response.json().catch(() => null)) as
        | { data?: unknown; error?: string; success?: boolean }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to load analytics.");
      }

      return payload.data;
    }),
    fetch(new URL("/api/alerts", request.url), {
      headers: {
        authorization: request.headers.get("authorization") ?? "",
      },
    }).then(async (response) => {
      const payload = (await response.json().catch(() => null)) as
        | { data?: unknown; error?: string; success?: boolean }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to load alerts.");
      }

      return payload.data;
    }),
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

  return successResponse({
    alerts: alertsResult,
    analytics: analyticsResult,
    counts: {
      organizations: organizationsResult.data?.length ?? 0,
      patients: patientsCountResult.count ?? 0,
      providers: providersResult.data?.length ?? 0,
      users: profilesResult.data?.length ?? 0,
    },
    organizations: organizationsResult.data ?? [],
    profiles: profilesResult.data ?? [],
    providers: providersResult.data ?? [],
  });
}
