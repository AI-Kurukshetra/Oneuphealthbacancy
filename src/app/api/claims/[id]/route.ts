import { deleteById, errorResponse, getAdminSupabase, hasActiveConsent, parseRequestBody, requireApiUser, sanitizeUpdate, successResponse } from "@/lib/api/fhir";
import type { ClaimUpdate } from "@/types/fhir";

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
  const { data, error } = await adminSupabase
    .from("claims")
    .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Claim not found.", 404);
  }

  if (auth.profile.role === "patient") {
    if (!data.patient_id) {
      return errorResponse("Claim patient is missing.", 500);
    }
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("id", data.patient_id).eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return errorResponse("Forbidden", 403);
    }
  }

  if (auth.profile.role === "insurance") {
    if (auth.profile.organization_id !== data.organization_id) {
      return errorResponse("Forbidden", 403);
    }
    if (!data.patient_id) {
      return errorResponse("Claim patient is missing.", 500);
    }
    const allowed = await hasActiveConsent(adminSupabase, data.patient_id, auth.profile.organization_id, "claims");
    if (!allowed) {
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

  if (!["insurance", "admin"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<ClaimUpdate>(request);
  if (!body) {
    return errorResponse("Invalid request body.", 400);
  }

  const adminSupabase = getAdminSupabase();
  if (auth.profile.role === "insurance") {
    const current = await adminSupabase.from("claims").select("organization_id, patient_id").eq("id", id).maybeSingle();
    if (current.error || !current.data) {
      return errorResponse(current.error?.message ?? "Claim not found.", current.data ? 500 : 404);
    }
    if (current.data.organization_id !== auth.profile.organization_id) {
      return errorResponse("Forbidden", 403);
    }
    const allowed = await hasActiveConsent(adminSupabase, current.data.patient_id ?? "", auth.profile.organization_id, "claims");
    if (!allowed) {
      return errorResponse("Forbidden", 403);
    }
  }

  const { data, error } = await adminSupabase
    .from("claims")
    .update(sanitizeUpdate(body))
    .eq("id", id)
    .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Claim not found.", 404);
  }

  return successResponse(data);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role !== "admin") {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  const { error } = await deleteById(adminSupabase, "claims", id);
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ id });
}
