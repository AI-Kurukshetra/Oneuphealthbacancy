import { errorResponse, getAdminSupabase, parseRequestBody, requireApiUser, successResponse } from "@/lib/api/fhir";
import type { ConsentInsert } from "@/types/fhir";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (!["patient", "admin"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<ConsentInsert>(request);
  if (!body?.patient_id || !body?.organization_id || !body?.access_type) {
    return errorResponse("patient_id, organization_id, and access_type are required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  if (auth.profile.role === "patient") {
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("id", body.patient_id).eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return errorResponse("Forbidden", 403);
    }
  }

  const { data, error } = await adminSupabase
    .from("consents")
    .upsert(
      {
        access_type: body.access_type,
        granted: false,
        granted_at: new Date().toISOString(),
        organization_id: body.organization_id,
        patient_id: body.patient_id,
      },
      { onConflict: "patient_id,organization_id,access_type" },
    )
    .select("id, patient_id, organization_id, access_type, granted, granted_at, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data);
}
