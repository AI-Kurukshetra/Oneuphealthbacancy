import type { SupabaseClient } from "@supabase/supabase-js";

import { DEVELOPER_ENDPOINTS } from "@/lib/developer/catalog";
import type { Database } from "@/types/database";
import type { ApiKey, Developer, DeveloperProfilePayload } from "@/types/developer";

type AdminSupabaseClient = SupabaseClient<Database>;

export function generateApiKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `hb_live_${suffix}`;
}

export function maskApiKey(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 10)}••••${value.slice(-4)}`;
}

export async function getDeveloperByUserId(adminSupabase: AdminSupabaseClient, userId: string) {
  return await adminSupabase
    .from("developers")
    .select("id, user_id, organization_name, created_at")
    .eq("user_id", userId)
    .maybeSingle();
}

export async function registerDeveloper(
  adminSupabase: AdminSupabaseClient,
  userId: string,
  organizationName: string,
) {
  return await adminSupabase
    .from("developers")
    .upsert(
      {
        organization_name: organizationName,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("id, user_id, organization_name, created_at")
    .single();
}

export async function listDeveloperApiKeys(adminSupabase: AdminSupabaseClient, developerId: string) {
  return await adminSupabase
    .from("api_keys")
    .select("id, developer_id, key, created_at, is_active")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });
}

export async function createDeveloperApiKey(adminSupabase: AdminSupabaseClient, developerId: string) {
  let key = generateApiKey();
  let attempts = 0;

  while (attempts < 5) {
    const result = await adminSupabase
      .from("api_keys")
      .insert({
        developer_id: developerId,
        is_active: true,
        key,
      })
      .select("id, developer_id, key, created_at, is_active")
      .single();

    if (!result.error) {
      return result;
    }

    if (!result.error.message.toLowerCase().includes("duplicate")) {
      return result;
    }

    key = generateApiKey();
    attempts += 1;
  }

  return await adminSupabase
    .from("api_keys")
    .insert({
      developer_id: developerId,
      is_active: true,
      key,
    })
    .select("id, developer_id, key, created_at, is_active")
    .single();
}

export async function updateApiKeyStatus(
  adminSupabase: AdminSupabaseClient,
  developerId: string,
  apiKeyId: string,
  isActive: boolean,
) {
  return await adminSupabase
    .from("api_keys")
    .update({ is_active: isActive })
    .eq("developer_id", developerId)
    .eq("id", apiKeyId)
    .select("id, developer_id, key, created_at, is_active")
    .maybeSingle();
}

export async function validateDeveloperApiKey(adminSupabase: AdminSupabaseClient, rawKey: string) {
  const { data, error } = await adminSupabase
    .from("api_keys")
    .select("id, developer_id, key, created_at, is_active")
    .eq("key", rawKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return { apiKey: null, developer: null };
  }

  const developerResult = await adminSupabase
    .from("developers")
    .select("id, user_id, organization_name, created_at")
    .eq("id", data.developer_id)
    .maybeSingle();

  if (developerResult.error || !developerResult.data) {
    return { apiKey: null, developer: null };
  }

  return {
    apiKey: data as ApiKey,
    developer: developerResult.data as Developer,
  };
}

export async function logDeveloperApiRequest(
  adminSupabase: AdminSupabaseClient,
  developerId: string,
  apiKeyId: string,
  method: string,
  path: string,
) {
  await adminSupabase.from("api_requests").insert({
    api_key_id: apiKeyId,
    developer_id: developerId,
    method,
    path,
  });
}

export async function getDeveloperProfilePayload(
  adminSupabase: AdminSupabaseClient,
  userId: string,
): Promise<DeveloperProfilePayload> {
  const developerResult = await getDeveloperByUserId(adminSupabase, userId);
  if (developerResult.error || !developerResult.data) {
    return {
      developer: null,
      stats: {
        active_api_keys: 0,
        available_endpoints: DEVELOPER_ENDPOINTS.length,
        total_api_requests: 0,
      },
    };
  }

  const developer = developerResult.data as Developer;
  const [keysResult, requestsResult] = await Promise.all([
    adminSupabase.from("api_keys").select("id", { count: "exact", head: true }).eq("developer_id", developer.id).eq("is_active", true),
    adminSupabase.from("api_requests").select("id", { count: "exact", head: true }).eq("developer_id", developer.id),
  ]);

  return {
    developer,
    stats: {
      active_api_keys: keysResult.count ?? 0,
      available_endpoints: DEVELOPER_ENDPOINTS.length,
      total_api_requests: requestsResult.count ?? 0,
    },
  };
}
