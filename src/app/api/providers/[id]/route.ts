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
import type { ProviderUpdate } from "@/types/fhir";

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
  if (auth.profile.role === "patient") {
    return errorResponse("Forbidden", 403);
  }

  if (auth.profile.role === "provider") {
    const providerScope = await ensureProviderScope(auth, adminSupabase, id);
    if (!providerScope.ok) {
      return providerScope.response;
    }
  }

  const { data, error } = await adminSupabase
    .from("providers")
    .select("id, user_id, name, email, specialty, organization_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Provider not found.", 404);
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
  const providerScope = await ensureProviderScope(auth, adminSupabase, id);
  if (!providerScope.ok) {
    return providerScope.response;
  }

  const body = await parseRequestBody<ProviderUpdate>(request);
  if (!body) {
    return errorResponse("Invalid request body.", 400);
  }

  const { data, error } = await adminSupabase
    .from("providers")
    .update(sanitizeUpdate(body))
    .eq("id", id)
    .select("id, user_id, name, email, specialty, organization_id, created_at")
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse("Provider not found.", 404);
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
  const { error } = await deleteById(adminSupabase, "providers", id);
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ id });
}
