import { NextResponse } from "next/server";

import { canAccessPatient } from "@/lib/access";
import { toBundle, toFhirObservation } from "@/lib/fhir";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const hasAccess = await canAccessPatient(id, "clinical");
  if (!hasAccess) {
    return NextResponse.json({ error: "Consent or authorization missing" }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("observations")
    .select("id, patient_id, type, value, unit, date, source_system")
    .eq("patient_id", id)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: toBundle((data ?? []).map(toFhirObservation)) });
}
