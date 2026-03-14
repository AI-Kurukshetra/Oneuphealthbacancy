import { ensureProviderScope, errorResponse, getAdminSupabase, parseRequestBody, requireApiUser, successResponse } from "@/lib/api/fhir";
import type { ProviderInsert } from "@/types/fhir";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role === "patient") {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  let query = adminSupabase
    .from("providers")
    .select("id, user_id, name, email, specialty, organization_id, created_at")
    .order("created_at", { ascending: false });

  if (auth.profile.role === "provider") {
    query = query.eq("user_id", auth.user.id);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role !== "admin") {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<ProviderInsert>(request);
  if (!body?.name || !body.organization_id || !body.specialty) {
    return errorResponse("name, organization_id, and specialty are required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const { data, error } = await adminSupabase
    .from("providers")
    .insert({
      email: body.email ?? null,
      name: body.name,
      organization_id: body.organization_id,
      specialty: body.specialty,
      user_id: body.user_id ?? null,
    })
    .select("id, user_id, name, email, specialty, organization_id, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
