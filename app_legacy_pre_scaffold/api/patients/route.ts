import { NextRequest, NextResponse } from "next/server";

import { toBundle, toFhirPatient } from "@/lib/fhir";
import { requireAuth } from "@/lib/auth";
import { parseBody, badRequest, serverError } from "@/lib/api";
import { patientSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth(["admin", "provider", "insurance", "patient"]);
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, profile } = auth;

  let query = supabase.from("patients").select("id, name, dob, gender, phone, address");
  if (profile.role === "patient") {
    query = query.eq("user_id", profile.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return serverError(error.message);
  }

  const bundle = toBundle((data ?? []).map(toFhirPatient));
  return NextResponse.json({ data: bundle });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["admin", "provider"]);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseBody<unknown>(request);
  if (!body) {
    return badRequest("Invalid JSON body");
  }

  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Validation failed");
  }

  const { data, error } = await auth.supabase
    .from("patients")
    .insert(parsed.data)
    .select("id, name, dob, gender, phone, address")
    .single();

  if (error) {
    return serverError(error.message);
  }

  return NextResponse.json({ data: toFhirPatient(data) }, { status: 201 });
}
