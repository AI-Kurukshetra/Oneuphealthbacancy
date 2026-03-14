import { NextResponse } from "next/server";

import { requireApiRole, type AuthenticatedContext } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ConsentAccessType, Database, ProfileRole } from "@/types/database";

export const ALL_API_ROLES: ProfileRole[] = ["patient", "provider", "insurance", "admin"];

export type ApiAuthResult = AuthenticatedContext | { response: NextResponse };
export type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function parseRequestBody<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function requireApiUser(request: Request): Promise<ApiAuthResult> {
  return requireApiRole(ALL_API_ROLES, request);
}

export { requireApiRole };

export function getAdminSupabase() {
  return createAdminSupabaseClient();
}

export async function getPatientRecord(adminSupabase: AdminSupabaseClient, patientId: string) {
  return await adminSupabase
    .from("patients")
    .select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at")
    .eq("id", patientId)
    .maybeSingle();
}

export async function getProviderRecordByUserId(adminSupabase: AdminSupabaseClient, userId: string) {
  return await adminSupabase
    .from("providers")
    .select("id, user_id, name, email, specialty, organization_id, created_at")
    .eq("user_id", userId)
    .maybeSingle();
}

export async function isPatientOwner(adminSupabase: AdminSupabaseClient, userId: string, patientId: string) {
  const { data } = await adminSupabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function hasActiveConsent(
  adminSupabase: AdminSupabaseClient,
  patientId: string,
  organizationId: string | null,
  accessType: ConsentAccessType,
) {
  if (!organizationId) {
    return false;
  }

  const { data } = await adminSupabase
    .from("consents")
    .select("id")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .eq("granted", true)
    .in("access_type", [accessType, "full"])
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function canReadPatientRecord(auth: AuthenticatedContext, adminSupabase: AdminSupabaseClient, patientId: string) {
  if (auth.profile.role === "admin" || auth.profile.role === "provider") {
    return true;
  }

  if (auth.profile.role === "patient") {
    return await isPatientOwner(adminSupabase, auth.user.id, patientId);
  }

  return false;
}

export async function canReadPatientClaims(auth: AuthenticatedContext, adminSupabase: AdminSupabaseClient, patientId: string) {
  if (auth.profile.role === "admin" || auth.profile.role === "provider") {
    return true;
  }

  if (auth.profile.role === "patient") {
    return await isPatientOwner(adminSupabase, auth.user.id, patientId);
  }

  if (auth.profile.role === "insurance") {
    return await hasActiveConsent(adminSupabase, patientId, auth.profile.organization_id, "claims");
  }

  return false;
}

export async function ensureProviderScope(
  auth: AuthenticatedContext,
  adminSupabase: AdminSupabaseClient,
  providerId: string | null | undefined,
  organizationId?: string | null,
) {
  if (auth.profile.role === "admin") {
    return { ok: true as const, provider: null };
  }

  if (auth.profile.role !== "provider") {
    return { ok: false as const, response: errorResponse("Forbidden", 403) };
  }

  const { data: provider, error } = await getProviderRecordByUserId(adminSupabase, auth.user.id);
  if (error || !provider) {
    return { ok: false as const, response: errorResponse("Provider profile not found.", 403) };
  }

  if (providerId && provider.id !== providerId) {
    return { ok: false as const, response: errorResponse("Providers can only act on their own records.", 403) };
  }

  if (organizationId && provider.organization_id && provider.organization_id !== organizationId) {
    return { ok: false as const, response: errorResponse("Provider organization mismatch.", 403) };
  }

  return { ok: true as const, provider };
}

export function sanitizeUpdate<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function deleteById(
  adminSupabase: AdminSupabaseClient,
  table: keyof Database["public"]["Tables"],
  id: string,
) {
  return await adminSupabase.from(table).delete().eq("id", id);
}
