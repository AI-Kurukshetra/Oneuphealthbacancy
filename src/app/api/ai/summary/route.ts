import { canReadPatientRecord, errorResponse, getAdminSupabase, parseRequestBody, requireApiUser, successResponse } from "@/lib/api/fhir";
import { fetchPatientDataset, generateHealthSummary } from "@/lib/ai/insights";

type SummaryRequest = {
  patient_id?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role === "insurance") {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<SummaryRequest>(request);
  if (!body?.patient_id) {
    return errorResponse("patient_id is required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const allowed = await canReadPatientRecord(auth, adminSupabase, body.patient_id);
  if (!allowed) {
    return errorResponse("Forbidden", 403);
  }

  try {
    const dataset = await fetchPatientDataset(adminSupabase, body.patient_id);
    if (!dataset.patient) {
      return errorResponse("Patient not found.", 404);
    }

    return successResponse({ summary: generateHealthSummary(dataset) });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to generate AI summary.", 500);
  }
}
