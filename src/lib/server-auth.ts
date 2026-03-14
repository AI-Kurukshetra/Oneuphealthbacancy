import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { logDeveloperApiRequest, validateDeveloperApiKey } from "@/lib/developer/service";
import { USER_ROLES } from "@/lib/roles";
import { getProfilesTableSetupMessage } from "@/lib/supabase/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, ProfileRole } from "@/types/database";
import type { ApiKey, Developer } from "@/types/developer";

export type AuthenticatedContext = {
  apiKey?: ApiKey | null;
  authMethod?: "api_key" | "session";
  developer?: Developer | null;
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  supabase: ReturnType<typeof createRouteHandlerClient<Database>>;
  user: {
    email: string | null | undefined;
    id: string;
  };
};

type UnauthorizedContext = {
  response: NextResponse;
};

export async function requireApiRole(
  allowedRoles: ProfileRole[],
  request?: Request,
): Promise<AuthenticatedContext | UnauthorizedContext> {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let authenticatedUser = user;
  let authenticatedEmail = user?.email;
  const adminSupabase = createAdminSupabaseClient();

  if ((userError || !user) && request) {
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";

    if (accessToken) {
      if (accessToken.startsWith("hb_live_")) {
        const developerAuth = await validateDeveloperApiKey(adminSupabase, accessToken);

        if (developerAuth.apiKey && developerAuth.developer) {
          const syntheticProfile: AuthenticatedContext["profile"] = {
            created_at: developerAuth.developer.created_at,
            email: `${developerAuth.developer.id}@developer.healthbridge.local`,
            full_name: developerAuth.developer.organization_name,
            id: developerAuth.developer.user_id,
            organization_id: null,
            role: "admin",
          };

          if (!allowedRoles.includes("admin")) {
            return {
              response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
            };
          }

          if (request) {
            try {
              const url = new URL(request.url);
              await logDeveloperApiRequest(
                adminSupabase,
                developerAuth.developer.id,
                developerAuth.apiKey.id,
                request.method,
                `${url.pathname}${url.search}`,
              );
            } catch {
              // Request logging is best-effort and must not block API access.
            }
          }

          return {
            apiKey: developerAuth.apiKey,
            authMethod: "api_key",
            developer: developerAuth.developer,
            profile: syntheticProfile,
            supabase,
            user: {
              email: syntheticProfile.email,
              id: developerAuth.developer.user_id,
            },
          };
        }
      }

      const {
        data: { user: tokenUser },
        error: tokenError,
      } = await adminSupabase.auth.getUser(accessToken);

      if (!tokenError && tokenUser) {
        authenticatedUser = tokenUser;
        authenticatedEmail = tokenUser.email;
      }
    }
  }

  if (!authenticatedUser) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  let { data: profileData, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, role, organization_id, full_name, email, created_at")
    .eq("id", authenticatedUser.id)
    .maybeSingle();

  if (!profileError && !profileData) {
    const metadataRole = authenticatedUser.user_metadata?.role;
    const metadataOrganizationId = authenticatedUser.user_metadata?.organization_id;
    const metadataFullName = authenticatedUser.user_metadata?.full_name;
    const role: ProfileRole =
      typeof metadataRole === "string" && USER_ROLES.includes(metadataRole as ProfileRole)
        ? (metadataRole as ProfileRole)
        : "patient";

    const { data: bootstrappedProfile, error: bootstrapError } = await adminSupabase
      .from("profiles")
      .upsert(
        {
          email: authenticatedEmail ?? null,
          full_name: typeof metadataFullName === "string" ? metadataFullName : null,
          id: authenticatedUser.id,
          organization_id: typeof metadataOrganizationId === "string" ? metadataOrganizationId : null,
          role,
        },
        { onConflict: "id" },
      )
      .select("id, role, organization_id, full_name, email, created_at")
      .single();

    profileData = bootstrappedProfile;
    profileError = bootstrapError;
  }

  const profile = profileData as AuthenticatedContext["profile"] | null;

  if (profileError || !profile) {
    return {
      response: NextResponse.json(
        { error: profileError ? getProfilesTableSetupMessage(profileError) : "Profile not found" },
        { status: 403 },
      ),
    };
  }

  if (!allowedRoles.includes(profile.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    apiKey: null,
    authMethod: "session",
    developer: null,
    profile,
    supabase,
    user: {
      email: authenticatedEmail,
      id: authenticatedUser.id,
    },
  };
}
