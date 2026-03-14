import { NextRequest, NextResponse } from "next/server";

import { parseBody, badRequest } from "@/lib/api";
import { getAnonSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await parseBody<{ email?: string; password?: string }>(request);
  if (!body?.email || !body.password) {
    return badRequest("email and password are required");
  }

  const supabase = getAnonSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      user: data.user,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    },
  });
}
