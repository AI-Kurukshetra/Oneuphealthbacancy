import { canReadPatientClaims, errorResponse, getAdminSupabase, hasActiveConsent, requireApiUser, successResponse } from "@/lib/api/fhir";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  const allowed = await canReadPatientClaims(auth, adminSupabase, id);
  if (!allowed) {
    return errorResponse("Forbidden", 403);
  }

  let query = adminSupabase
    .from("claims")
    .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
    .eq("patient_id", id)
    .order("submitted_at", { ascending: false });

  if (auth.profile.role === "insurance") {
    if (!auth.profile.organization_id) {
      return successResponse([]);
    }
    query = query.eq("organization_id", auth.profile.organization_id);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }

  if (auth.profile.role !== "insurance") {
    return successResponse(data ?? []);
  }

  const filtered: NonNullable<typeof data> = [];
  for (const claim of data ?? []) {
    if (!claim.patient_id) {
      continue;
    }
    const allowed = await hasActiveConsent(adminSupabase, claim.patient_id, auth.profile.organization_id, "claims");
    if (allowed) {
      filtered.push(claim);
    }
  }

  return successResponse(filtered);
}
