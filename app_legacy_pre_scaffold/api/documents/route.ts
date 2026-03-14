import { NextRequest, NextResponse } from "next/server";

import { canAccessPatient } from "@/lib/access";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { parseBody, badRequest } from "@/lib/api";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patient_id");
  if (!patientId) {
    return badRequest("patient_id is required");
  }

  const hasAccess = await canAccessPatient(patientId, "documents");
  if (!hasAccess) {
    return NextResponse.json({ error: "Consent or authorization missing" }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("id, patient_id, title, mime_type, bucket_path, source_system, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["patient", "provider", "admin"]);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseBody<{
    patient_id?: string;
    title?: string;
    mime_type?: string;
    source_system?: string;
    file_base64?: string;
  }>(request);

  if (!body?.patient_id || !body.title || !body.mime_type || !body.file_base64) {
    return badRequest("patient_id, title, mime_type and file_base64 are required");
  }

  if (auth.profile.role === "patient") {
    const { data: ownPatient } = await auth.supabase
      .from("patients")
      .select("id")
      .eq("id", body.patient_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!ownPatient) {
      return NextResponse.json({ error: "Patient can only upload own documents" }, { status: 403 });
    }
  }

  const extension = body.mime_type.includes("pdf") ? "pdf" : "bin";
  const filePath = `${body.patient_id}/${crypto.randomUUID()}.${extension}`;

  const buffer = Buffer.from(body.file_base64, "base64");
  const { error: storageError } = await auth.supabase.storage.from("health-reports").upload(filePath, buffer, {
    upsert: false,
    contentType: body.mime_type,
  });

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { data, error } = await auth.supabase
    .from("documents")
    .insert({
      patient_id: body.patient_id,
      uploaded_by: auth.user.id,
      title: body.title,
      mime_type: body.mime_type,
      source_system: body.source_system ?? "patient-upload",
      bucket_path: filePath,
    })
    .select("id, patient_id, title, mime_type, bucket_path, source_system, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
