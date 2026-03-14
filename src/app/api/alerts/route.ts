import { errorResponse, getAdminSupabase, requireApiUser, successResponse } from "@/lib/api/fhir";
import { syncPatientAlerts } from "@/lib/ai/insights";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role === "insurance") {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  const requestedPatientId = new URL(request.url).searchParams.get("patient_id");

  try {
    if (auth.profile.role === "patient") {
      const { data: patient, error } = await adminSupabase.from("patients").select("id").eq("user_id", auth.user.id).maybeSingle();
      if (error) {
        return errorResponse(error.message, 500);
      }
      if (!patient) {
        return successResponse([]);
      }

      return successResponse(await syncPatientAlerts(adminSupabase, patient.id));
    }

    if (requestedPatientId) {
      return successResponse(await syncPatientAlerts(adminSupabase, requestedPatientId));
    }

    const { data: patients, error } = await adminSupabase.from("patients").select("id");
    if (error) {
      return errorResponse(error.message, 500);
    }

    const alertRows = await Promise.all((patients ?? []).map((patient) => syncPatientAlerts(adminSupabase, patient.id)));
    return successResponse(alertRows.flat().sort((left, right) => right.created_at.localeCompare(left.created_at)));
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to generate alerts.", 500);
  }
}
