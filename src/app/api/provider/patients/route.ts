import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireApiRole(["provider", "admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, gender, phone, address, user_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
