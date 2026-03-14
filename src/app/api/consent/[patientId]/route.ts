import { errorResponse, getAdminSupabase, requireApiUser, successResponse } from "@/lib/api/fhir";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  if (auth.profile.role === "patient") {
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("id", patientId).eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return errorResponse("Forbidden", 403);
    }
  } else if (!["admin", "provider"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const { data, error } = await adminSupabase
    .from("consents")
    .select("id, patient_id, organization_id, access_type, granted, granted_at, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data ?? []);
}
