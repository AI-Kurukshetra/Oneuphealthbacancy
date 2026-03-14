import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/constants";

export async function requireAuth(allowedRoles?: UserRole[]) {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      response: NextResponse.json({ error: "Profile not found" }, { status: 403 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, profile, supabase };
}
