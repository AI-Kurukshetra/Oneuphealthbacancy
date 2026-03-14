import {
  canReadPatientRecord,
  ensureProviderScope,
  errorResponse,
  getAdminSupabase,
  parseRequestBody,
  requireApiUser,
  successResponse,
} from "@/lib/api/fhir";
import type { EncounterInsert } from "@/types/fhir";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  let query = adminSupabase
    .from("encounters")
    .select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at")
    .order("visit_date", { ascending: false });

  if (auth.profile.role === "patient") {
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return successResponse([]);
    }
    query = query.eq("patient_id", patient.id);
  } else if (auth.profile.role === "insurance") {
    return errorResponse("Forbidden", 403);
  } else if (auth.profile.role === "provider") {
    const providerScope = await ensureProviderScope(auth, adminSupabase, null);
    if (!providerScope.ok) {
      return providerScope.response;
    }
    if (!providerScope.provider) {
      return errorResponse("Provider profile not found.", 403);
    }
    query = query.eq("provider_id", providerScope.provider.id);
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

  const body = await parseRequestBody<EncounterInsert>(request);
  if (!body?.patient_id || !body?.provider_id || !body?.organization_id || !body?.visit_date || !body?.reason || !body?.diagnosis) {
    return errorResponse("patient_id, provider_id, organization_id, visit_date, reason, and diagnosis are required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const patientReadable = await canReadPatientRecord(auth, adminSupabase, body.patient_id);
  if (auth.profile.role === "patient" || !patientReadable && auth.profile.role === "provider") {
    return errorResponse("Forbidden", 403);
  }

  const providerScope = await ensureProviderScope(auth, adminSupabase, body.provider_id, body.organization_id);
  if (!providerScope.ok) {
    return providerScope.response;
  }

  const { data, error } = await adminSupabase
    .from("encounters")
    .insert({
      diagnosis: body.diagnosis,
      notes: body.notes ?? null,
      organization_id: body.organization_id,
      patient_id: body.patient_id,
      provider_id: body.provider_id,
      reason: body.reason,
      visit_date: body.visit_date,
    })
    .select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
