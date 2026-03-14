import {
  canReadPatientRecord,
  ensureProviderScope,
  errorResponse,
  getAdminSupabase,
  parseRequestBody,
  requireApiUser,
  successResponse,
} from "@/lib/api/fhir";
import type { ObservationInsert } from "@/types/fhir";

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
    .from("observations")
    .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
    .order("observed_at", { ascending: false });

  if (auth.profile.role === "patient") {
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return successResponse([]);
    }
    query = query.eq("patient_id", patient.id);
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

  const body = await parseRequestBody<ObservationInsert>(request);
  if (!body?.patient_id || !body?.type || !body?.value || !body?.unit || !body?.observed_at) {
    return errorResponse("patient_id, type, value, unit, and observed_at are required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const allowed = await canReadPatientRecord(auth, adminSupabase, body.patient_id);
  if (!allowed && auth.profile.role === "provider") {
    return errorResponse("Forbidden", 403);
  }

  if (body.encounter_id && auth.profile.role === "provider") {
    const { data: encounter } = await adminSupabase
      .from("encounters")
      .select("provider_id, organization_id")
      .eq("id", body.encounter_id)
      .maybeSingle();
    if (!encounter) {
      return errorResponse("Encounter not found.", 404);
    }
    const providerScope = await ensureProviderScope(auth, adminSupabase, encounter.provider_id, encounter.organization_id);
    if (!providerScope.ok) {
      return providerScope.response;
    }
  }

  const { data, error } = await adminSupabase
    .from("observations")
    .insert({
      encounter_id: body.encounter_id ?? null,
      observed_at: body.observed_at,
      patient_id: body.patient_id,
      type: body.type,
      unit: body.unit,
      value: body.value,
    })
    .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
