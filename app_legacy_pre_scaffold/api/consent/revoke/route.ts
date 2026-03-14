import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { parseBody, badRequest } from "@/lib/api";
import { consentSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["patient", "admin"]);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseBody<unknown>(request);
  if (!body) {
    return badRequest("Invalid JSON body");
  }

  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Validation failed");
  }

  if (auth.profile.role === "patient") {
    const { data: ownPatient } = await auth.supabase
      .from("patients")
      .select("id")
      .eq("id", parsed.data.patient_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!ownPatient) {
      return NextResponse.json({ error: "Patient can only revoke consent for own profile" }, { status: 403 });
    }
  }

  const { data, error } = await auth.supabase
    .from("consents")
    .upsert({ ...parsed.data, granted: false }, { onConflict: "patient_id,organization_id,access_type" })
    .select("id, patient_id, organization_id, access_type, granted, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
