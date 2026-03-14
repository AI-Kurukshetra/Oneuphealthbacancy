import { NextResponse } from "next/server";

import { canAccessPatient } from "@/lib/access";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;

  const hasAccess = await canAccessPatient(patientId, "full");
  if (!hasAccess) {
    return NextResponse.json({ error: "Consent or authorization missing" }, { status: 403 });
  }

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("consents")
    .select("id, patient_id, organization_id, access_type, granted, updated_at")
    .eq("patient_id", patientId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
