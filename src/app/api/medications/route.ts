import {
  canReadPatientRecord,
  ensureProviderScope,
  errorResponse,
  getAdminSupabase,
  parseRequestBody,
  requireApiUser,
  successResponse,
} from "@/lib/api/fhir";
import type { MedicationInsert } from "@/types/fhir";

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
    .from("medications")
    .select("id, patient_id, provider_id, name, dosage, frequency, start_date, end_date, created_at")
    .order("created_at", { ascending: false });

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

  const body = await parseRequestBody<MedicationInsert>(request);
  if (!body?.patient_id || !body?.provider_id || !body?.name || !body?.dosage || !body?.frequency || !body?.start_date) {
    return errorResponse("patient_id, provider_id, name, dosage, frequency, and start_date are required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const allowed = await canReadPatientRecord(auth, adminSupabase, body.patient_id);
  if (!allowed && auth.profile.role === "provider") {
    return errorResponse("Forbidden", 403);
  }

  const providerScope = await ensureProviderScope(auth, adminSupabase, body.provider_id);
  if (!providerScope.ok) {
    return providerScope.response;
  }

  const { data, error } = await adminSupabase
    .from("medications")
    .insert({
      dosage: body.dosage,
      end_date: body.end_date ?? null,
      frequency: body.frequency,
      name: body.name,
      patient_id: body.patient_id,
      provider_id: body.provider_id,
      start_date: body.start_date,
    })
    .select("id, patient_id, provider_id, name, dosage, frequency, start_date, end_date, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
