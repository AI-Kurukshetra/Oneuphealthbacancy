import {
  canReadPatientRecord,
  deleteById,
  errorResponse,
  getAdminSupabase,
  getPatientRecord,
  parseRequestBody,
  requireApiUser,
  sanitizeUpdate,
  successResponse,
} from "@/lib/api/fhir";
import type { PatientUpdate } from "@/types/fhir";

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

  const { data, error } = await getPatientRecord(adminSupabase, id);
  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Patient not found.", 404);
  }

  return successResponse(data);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  const isOwner = auth.profile.role === "patient" ? await canReadPatientRecord(auth, adminSupabase, id) : false;
  if (!["provider", "admin"].includes(auth.profile.role) && !isOwner) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<PatientUpdate>(request);
  if (!body) {
    return errorResponse("Invalid request body.", 400);
  }

  const { data, error } = await adminSupabase
    .from("patients")
    .update(sanitizeUpdate(body))
    .eq("id", id)
    .select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at")
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Patient not found.", 404);
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
  const { error } = await deleteById(adminSupabase, "patients", id);
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ id });
}
