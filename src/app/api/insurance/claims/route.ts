import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ClaimStatus } from "@/types/database";

const ALLOWED_STATUSES: ClaimStatus[] = ["pending", "approved", "rejected"];

type ClaimRow = {
  amount: number | null;
  created_at: string;
  id: string;
  organization_id: string | null;
  patient_id: string | null;
  provider_id: string | null;
  status: ClaimStatus | null;
  submitted_at: string | null;
};

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(["insurance", "admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = createAdminSupabaseClient();
  let claimsQuery = adminSupabase
    .from("claims")
    .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
    .order("submitted_at", { ascending: false });

  if (auth.profile.role === "insurance" && auth.profile.organization_id) {
    claimsQuery = claimsQuery.eq("organization_id", auth.profile.organization_id);
  }

  const { data: claims, error } = await claimsQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const patientIds = [
    ...new Set(
      (claims ?? [])
        .map((claim) => claim.patient_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
  const providerIds = [
    ...new Set(
      (claims ?? [])
        .map((claim) => claim.provider_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];

  const [{ data: patients }, { data: providers }, { data: encounters }] = await Promise.all([
    patientIds.length
      ? adminSupabase
          .from("patients")
          .select("id, first_name, last_name, date_of_birth, gender")
          .in("id", patientIds)
      : Promise.resolve({ data: [] as never[] }),
    providerIds.length
      ? adminSupabase.from("providers").select("id, name, specialty").in("id", providerIds)
      : Promise.resolve({ data: [] as never[] }),
    patientIds.length
      ? adminSupabase
          .from("encounters")
          .select("id, patient_id, provider_id, visit_date, reason, diagnosis")
          .in("patient_id", patientIds)
          .order("visit_date", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const patientMap = new Map(
    (patients ?? []).map((patient) => [
      patient.id,
      `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unknown patient",
    ]),
  );
  const providerMap = new Map((providers ?? []).map((provider) => [provider.id, provider.name ?? "Unknown provider"]));

  const latestEncounterByPatient = new Map<string, { diagnosis: string | null; reason: string | null; visit_date: string | null }>();
  for (const encounter of encounters ?? []) {
    if (encounter.patient_id && !latestEncounterByPatient.has(encounter.patient_id)) {
      latestEncounterByPatient.set(encounter.patient_id, {
        diagnosis: encounter.diagnosis,
        reason: encounter.reason,
        visit_date: encounter.visit_date,
      });
    }
  }

  const enrichedClaims = (claims ?? []).map((claim: ClaimRow) => ({
    ...claim,
    latestEncounter: claim.patient_id ? latestEncounterByPatient.get(claim.patient_id) ?? null : null,
    patient_name: claim.patient_id ? patientMap.get(claim.patient_id) ?? "Unknown patient" : "Unknown patient",
    provider_name: claim.provider_id ? providerMap.get(claim.provider_id) ?? "Unknown provider" : "Unknown provider",
  }));

  return NextResponse.json({ data: enrichedClaims });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiRole(["insurance", "admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as { claimId?: string; status?: ClaimStatus } | null;
  if (!body?.claimId || !body.status || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "claimId and a valid status are required." }, { status: 400 });
  }

  const adminSupabase = createAdminSupabaseClient();

  if (auth.profile.role === "insurance") {
    const { data: claim } = await adminSupabase
      .from("claims")
      .select("id, organization_id")
      .eq("id", body.claimId)
      .maybeSingle();

    if (!claim || claim.organization_id !== auth.profile.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await adminSupabase
    .from("claims")
    .update({ status: body.status })
    .eq("id", body.claimId)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
