import { canReadPatientRecord, errorResponse, getAdminSupabase, requireApiUser, successResponse } from "@/lib/api/fhir";

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
  const allowed = await canReadPatientRecord(auth, adminSupabase, id);
  if (!allowed) {
    return errorResponse("Forbidden", 403);
  }

  const { data, error } = await adminSupabase
    .from("observations")
    .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
    .eq("patient_id", id)
    .order("observed_at", { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data ?? []);
}
