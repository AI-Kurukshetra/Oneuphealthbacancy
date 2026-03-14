import { NextResponse } from "next/server";

import { ORGANIZATION_TYPES } from "@/lib/roles";
import { requireApiRole } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { OrganizationType } from "@/types/database";

type CreateOrganizationPayload = {
  address?: string;
  name?: string;
  type?: OrganizationType;
};

export async function GET(request: Request) {
  const auth = await requireApiRole(["admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("organizations")
    .select("id, name, type, address, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as CreateOrganizationPayload | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const address = body.address?.trim() || null;
  const type = body.type;

  if (!name || !type || !ORGANIZATION_TYPES.includes(type)) {
    return NextResponse.json({ error: "Organization name and valid type are required." }, { status: 400 });
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("organizations")
    .insert({ address, name, type })
    .select("id, name, type, address, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
