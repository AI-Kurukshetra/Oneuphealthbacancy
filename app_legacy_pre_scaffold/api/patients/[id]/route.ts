import { NextResponse } from "next/server";

import { canAccessPatient } from "@/lib/access";
import { getServerSupabase } from "@/lib/supabase/server";
import { toBundle, toFhirPatient } from "@/lib/fhir";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const hasAccess = await canAccessPatient(id, "full");
  if (!hasAccess) {
    return NextResponse.json({ error: "Consent or authorization missing" }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, dob, gender, phone, address")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ data: toBundle([toFhirPatient(data)], "collection") });
}
