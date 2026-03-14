import { getAdminSupabase, requireApiUser, successResponse, errorResponse, parseRequestBody } from "@/lib/api/fhir";
import type { PatientInsert } from "@/types/fhir";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (auth.profile.role === "insurance") {
    return errorResponse("Forbidden", 403);
  }

  const adminSupabase = getAdminSupabase();
  let query = adminSupabase
    .from("patients")
    .select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at")
    .order("created_at", { ascending: false });

  if (auth.profile.role === "patient") {
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

  if (!["provider", "admin"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<PatientInsert>(request);
  if (!body) {
    return errorResponse("Invalid request body.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const payload: PatientInsert = {
    address: body.address ?? null,
    date_of_birth: body.date_of_birth ?? null,
    first_name: body.first_name ?? null,
    gender: body.gender ?? null,
    last_name: body.last_name ?? null,
    phone: body.phone ?? null,
    user_id: body.user_id ?? null,
  };

  const { data, error } = await adminSupabase
    .from("patients")
    .insert(payload)
    .select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
