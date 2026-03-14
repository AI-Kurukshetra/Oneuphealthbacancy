import { NextRequest, NextResponse } from "next/server";

import { parseBody, badRequest } from "@/lib/api";
import { getAnonSupabase } from "@/lib/supabase/admin";
import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await parseBody<{ email?: string; password?: string; role?: UserRole; organization_id?: string }>(request);

  if (!body?.email || !body.password) {
    return badRequest("email and password are required");
  }

  if (body.role && !USER_ROLES.includes(body.role)) {
    return badRequest("invalid role");
  }

  const anon = getAnonSupabase();
  const { data, error } = await anon.auth.signUp({ email: body.email, password: body.password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "User registration failed" }, { status: 500 });
  }

  const admin = getAdminSupabase();
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role: body.role ?? "patient",
    organization_id: body.organization_id ?? null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { user: data.user } }, { status: 201 });
}
