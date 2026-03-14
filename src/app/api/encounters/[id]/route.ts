import {
  deleteById,
  ensureProviderScope,
  errorResponse,
  getAdminSupabase,
  parseRequestBody,
  requireApiUser,
  sanitizeUpdate,
  successResponse,
} from "@/lib/api/fhir";
import type { EncounterUpdate } from "@/types/fhir";

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
    .from("encounters")
    .select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Encounter not found.", 404);
  }

  if (auth.profile.role === "patient") {
    if (!data.patient_id) {
      return errorResponse("Encounter patient is missing.", 500);
    }
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("id", data.patient_id).eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return errorResponse("Forbidden", 403);
    }
  }

  if (auth.profile.role === "provider") {
    if (!data.provider_id) {
      return errorResponse("Encounter provider is missing.", 500);
    }
    const providerScope = await ensureProviderScope(auth, adminSupabase, data.provider_id, data.organization_id);
    if (!providerScope.ok) {
      return providerScope.response;
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

  const body = await parseRequestBody<EncounterUpdate>(request);
  if (!body) {
    return errorResponse("Invalid request body.", 400);
  }

  const adminSupabase = getAdminSupabase();
  if (auth.profile.role === "provider") {
    const existing = await adminSupabase.from("encounters").select("provider_id, organization_id").eq("id", id).maybeSingle();
    if (existing.error || !existing.data) {
      return errorResponse(existing.error?.message ?? "Encounter not found.", existing.data ? 500 : 404);
    }
    const providerScope = await ensureProviderScope(
      auth,
      adminSupabase,
      body.provider_id ?? existing.data.provider_id,
      body.organization_id ?? existing.data.organization_id,
    );
    if (!providerScope.ok) {
      return providerScope.response;
    }
  }

  const { data, error } = await adminSupabase
    .from("encounters")
    .update(sanitizeUpdate(body))
    .eq("id", id)
    .select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at")
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Encounter not found.", 404);
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
  if (auth.profile.role === "provider") {
    const existing = await adminSupabase.from("encounters").select("provider_id, organization_id").eq("id", id).maybeSingle();
    if (existing.error || !existing.data) {
      return errorResponse(existing.error?.message ?? "Encounter not found.", existing.data ? 500 : 404);
    }
    const providerScope = await ensureProviderScope(auth, adminSupabase, existing.data.provider_id, existing.data.organization_id);
    if (!providerScope.ok) {
      return providerScope.response;
    }
  }

  const { error } = await deleteById(adminSupabase, "encounters", id);
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ id });
}
