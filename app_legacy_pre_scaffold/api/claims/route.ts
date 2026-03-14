import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { parseBody, badRequest } from "@/lib/api";
import { claimSchema } from "@/lib/validation";
import { toFhirClaim } from "@/lib/fhir";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["provider", "insurance", "admin"]);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseBody<unknown>(request);
  if (!body) {
    return badRequest("Invalid JSON body");
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Validation failed");
  }

  const { data, error } = await auth.supabase
    .from("claims")
    .insert(parsed.data)
    .select("id, patient_id, provider_id, amount, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toFhirClaim(data) }, { status: 201 });
}
