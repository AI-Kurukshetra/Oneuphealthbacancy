import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requiresOrganization, splitFullName, USER_ROLES } from "@/lib/roles";
import { requireApiRole } from "@/lib/server-auth";
import { getProfilesTableSetupMessage } from "@/lib/supabase/errors";
import type { ProfileRole } from "@/types/database";

type CreateUserPayload = {
  deliveryMethod?: "invite" | "manual_password";
  email?: string;
  fullName?: string;
  organizationId?: string | null;
  role?: ProfileRole;
  specialty?: string;
};

function createTemporaryPassword() {
  const token = randomBytes(9).toString("base64url");
  return `Hb!${token}9a`;
}

function isEmailRateLimitError(message: string | undefined) {
  return (message ?? "").toLowerCase().includes("rate limit");
}

async function syncProviderRecord(params: {
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>;
  email: string;
  fullName: string;
  organizationId: string | null;
  specialty: string | null;
  userId: string;
}) {
  const { adminSupabase, email, fullName, organizationId, specialty, userId } = params;

  const providerPayload = {
    email,
    name: fullName,
    organization_id: organizationId,
    specialty,
    user_id: userId,
  };

  const { data: existingByUserId, error: existingByUserIdError } = await adminSupabase
    .from("providers")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingByUserIdError) {
    return existingByUserIdError;
  }

  if (existingByUserId?.id) {
    const { error } = await adminSupabase.from("providers").update(providerPayload).eq("id", existingByUserId.id);
    return error;
  }

  const { data: existingByEmail, error: existingByEmailError } = await adminSupabase
    .from("providers")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (existingByEmailError) {
    return existingByEmailError;
  }

  if (existingByEmail?.id) {
    const { error } = await adminSupabase.from("providers").update(providerPayload).eq("id", existingByEmail.id);
    return error;
  }

  const { error } = await adminSupabase.from("providers").insert(providerPayload);
  return error;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(["admin"], request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as CreateUserPayload | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.fullName?.trim();
  const role = body.role;
  const specialty = body.specialty?.trim() || null;
  const organizationId = body.organizationId?.trim() || null;
  const deliveryMethod = body.deliveryMethod ?? "manual_password";

  if (!email || !fullName || !role || !USER_ROLES.includes(role)) {
    return NextResponse.json({ error: "Full name, email, and a valid role are required." }, { status: 400 });
  }

  if (requiresOrganization(role) && !organizationId) {
    return NextResponse.json({ error: "This role must be assigned to an organization." }, { status: 400 });
  }

  if (role === "provider" && !specialty) {
    return NextResponse.json({ error: "Provider specialty is required." }, { status: 400 });
  }

  const adminSupabase = createAdminSupabaseClient();
  const origin = request.nextUrl.origin;
  const userMetadata = {
    full_name: fullName,
    organization_id: organizationId,
    role,
  };

  let userId: string | null = null;
  let temporaryPassword: string | null = null;
  let finalDeliveryMethod: "invite" | "manual_password" = deliveryMethod;

  if (deliveryMethod === "invite") {
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: userMetadata,
      redirectTo: `${origin}/login`,
    });

    if (inviteError && !isEmailRateLimitError(inviteError.message)) {
      return NextResponse.json(
        { error: inviteError.message ?? "Unable to create the user invitation." },
        { status: 400 },
      );
    }

    if (inviteData.user?.id) {
      userId = inviteData.user.id;
    } else {
      finalDeliveryMethod = "manual_password";
    }
  }

  if (finalDeliveryMethod === "manual_password") {
    temporaryPassword = createTemporaryPassword();
    const { data: createUserData, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: temporaryPassword,
      user_metadata: userMetadata,
    });

    if (createUserError || !createUserData.user) {
      return NextResponse.json(
        { error: createUserError?.message ?? "Unable to create the user with a temporary password." },
        { status: 400 },
      );
    }

    userId = createUserData.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unable to create the user." }, { status: 500 });
  }

  const { error: profileError } = await adminSupabase.from("profiles").upsert(
    {
      email,
      full_name: fullName,
      id: userId,
      organization_id: organizationId,
      role,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return NextResponse.json({ error: getProfilesTableSetupMessage(profileError) }, { status: 500 });
  }

  if (role === "provider") {
    const providerError = await syncProviderRecord({
      adminSupabase,
      email,
      fullName,
      organizationId,
      specialty,
      userId,
    });

    if (providerError) {
      return NextResponse.json({ error: providerError.message }, { status: 500 });
    }
  }

  if (role === "patient") {
    const { firstName, lastName } = splitFullName(fullName);
    const { error: patientError } = await adminSupabase.from("patients").insert({
      first_name: firstName || fullName,
      last_name: lastName || null,
      user_id: userId,
    });

    if (patientError && !patientError.message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: patientError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    data: {
      deliveryMethod: finalDeliveryMethod,
      email,
      fullName,
      loginUrl: `${origin}/login`,
      nextStep:
        finalDeliveryMethod === "manual_password"
          ? "Use the temporary password once, sign in from the login URL, then change the password from the Supabase account flow if needed."
          : "Supabase sends an invite email. The user must open that email, follow the invite link, set a password, and then sign in from the login URL.",
      role,
      temporaryPassword,
      userId,
    },
    message:
      finalDeliveryMethod === "manual_password"
        ? `User created without email invite.\nLogin URL: ${origin}/login\nEmail: ${email}\nTemporary password: ${temporaryPassword}`
        : `User created. Invite email sent to ${email}. The user must set their password from the email invite, then sign in at ${origin}/login.`,
  });
}
