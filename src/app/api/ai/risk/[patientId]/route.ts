import { canReadPatientRecord, errorResponse, getAdminSupabase, requireApiUser, successResponse } from "@/lib/api/fhir";
import { calculateRiskScore, fetchPatientDataset } from "@/lib/ai/insights";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role === "insurance") {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  const allowed = await canReadPatientRecord(auth, adminSupabase, patientId);
  if (!allowed) {
    return errorResponse("Forbidden", 403);
  }

  try {
    const dataset = await fetchPatientDataset(adminSupabase, patientId);
    if (!dataset.patient) {
      return errorResponse("Patient not found.", 404);
    }

    return successResponse(
      calculateRiskScore({
        claims: dataset.claims,
        encounters: dataset.encounters,
        medications: dataset.medications,
        observations: dataset.observations,
        patient_id: patientId,
      }),
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to calculate risk score.", 500);
  }
}
