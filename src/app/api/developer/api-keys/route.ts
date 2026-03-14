import { errorResponse, getAdminSupabase, requireApiUser, successResponse } from "@/lib/api/fhir";
import { createDeveloperApiKey, getDeveloperByUserId, listDeveloperApiKeys, maskApiKey } from "@/lib/developer/service";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  const developerResult = await getDeveloperByUserId(adminSupabase, auth.user.id);
  if (developerResult.error) {
    return errorResponse(developerResult.error.message, 500);
  }
  if (!developerResult.data) {
    return successResponse([]);
  }

  const keysResult = await listDeveloperApiKeys(adminSupabase, developerResult.data.id);
  if (keysResult.error) {
    return errorResponse(keysResult.error.message, 500);
  }

  return successResponse(
    (keysResult.data ?? []).map((entry) => ({
      ...entry,
      key: maskApiKey(entry.key),
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const adminSupabase = getAdminSupabase();
  const developerResult = await getDeveloperByUserId(adminSupabase, auth.user.id);
  if (developerResult.error) {
    return errorResponse(developerResult.error.message, 500);
  }
  if (!developerResult.data) {
    return errorResponse("Developer profile not found. Register first.", 404);
  }

  const keyResult = await createDeveloperApiKey(adminSupabase, developerResult.data.id);
  if (keyResult.error || !keyResult.data) {
    return errorResponse(keyResult.error?.message ?? "Unable to create API key.", 500);
  }

  return successResponse(keyResult.data, 201);
}
