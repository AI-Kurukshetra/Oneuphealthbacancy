import { errorResponse, requireApiRole, successResponse } from "@/lib/api/fhir";
import { fetchPopulationMetrics } from "@/lib/ai/insights";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireApiRole(["admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    return successResponse(await fetchPopulationMetrics(createAdminSupabaseClient()));
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to load analytics metrics.", 500);
  }
}
