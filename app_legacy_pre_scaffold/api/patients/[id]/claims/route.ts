import { NextResponse } from "next/server";

import { canAccessPatient } from "@/lib/access";
import { toBundle, toFhirClaim } from "@/lib/fhir";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const hasAccess = await canAccessPatient(id, "claims");
  if (!hasAccess) {
    return NextResponse.json({ error: "Consent or authorization missing" }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("claims")
    .select("id, patient_id, provider_id, amount, status")
    .eq("patient_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toBundle((data ?? []).map(toFhirClaim)) });
}
