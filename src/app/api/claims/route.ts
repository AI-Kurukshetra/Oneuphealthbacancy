import {
  canReadPatientClaims,
  errorResponse,
  getAdminSupabase,
  hasActiveConsent,
  parseRequestBody,
  requireApiUser,
  successResponse,
} from "@/lib/api/fhir";
import type { ClaimInsert } from "@/types/fhir";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  let query = adminSupabase
    .from("claims")
    .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
    .order("submitted_at", { ascending: false });

  if (auth.profile.role === "patient") {
    const { data: patient } = await adminSupabase.from("patients").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!patient) {
      return successResponse([]);
    }
    query = query.eq("patient_id", patient.id);
  } else if (auth.profile.role === "insurance") {
    if (!auth.profile.organization_id) {
      return successResponse([]);
    }
    query = query.eq("organization_id", auth.profile.organization_id);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }

  let filtered = data ?? [];
  if (auth.profile.role === "insurance") {
    const permitted: typeof filtered = [];
    for (const claim of filtered) {
      if (!claim.patient_id) {
        continue;
      }
      const allowed = await hasActiveConsent(adminSupabase, claim.patient_id, auth.profile.organization_id, "claims");
      if (allowed) {
        permitted.push(claim);
      }
    }
    filtered = permitted;
  }

  return successResponse(filtered);
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  if (!["insurance", "admin", "provider"].includes(auth.profile.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseRequestBody<ClaimInsert>(request);
  if (!body?.patient_id || !body?.provider_id || !body?.organization_id || typeof body.amount !== "number") {
    return errorResponse("patient_id, provider_id, organization_id, and amount are required.", 400);
  }

  const adminSupabase = getAdminSupabase();
  if (auth.profile.role === "insurance" && auth.profile.organization_id !== body.organization_id) {
    return errorResponse("Insurance users can only create claims for their own organization.", 403);
  }

  const { data, error } = await adminSupabase
    .from("claims")
    .insert({
      amount: body.amount,
      organization_id: body.organization_id,
      patient_id: body.patient_id,
      provider_id: body.provider_id,
      status: body.status ?? "pending",
      submitted_at: body.submitted_at ?? new Date().toISOString(),
    })
    .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
