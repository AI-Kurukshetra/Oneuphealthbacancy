import { deleteById, errorResponse, getAdminSupabase, parseRequestBody, requireApiUser, sanitizeUpdate, successResponse } from "@/lib/api/fhir";
import type { ObservationUpdate } from "@/types/fhir";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role === "insurance") {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  const { data, error } = await adminSupabase
    .from("observations")
    .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Observation not found.", 404);
  }

  if (auth.profile.role === "patient") {
    if (!data.patient_id) {
      return errorResponse("Observation patient is missing.", 500);
    }
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("id", data.patient_id).eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return errorResponse("Forbidden", 403);
    }
  }

  return successResponse(data);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (!["provider", "admin"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<ObservationUpdate>(request);
  if (!body) {
    return errorResponse("Invalid request body.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const { data, error } = await adminSupabase
    .from("observations")
    .update(sanitizeUpdate(body))
    .eq("id", id)
    .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Observation not found.", 404);
  }

  return successResponse(data);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (!["provider", "admin"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  const { error } = await deleteById(adminSupabase, "observations", id);
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ id });
}
