import { errorResponse, getAdminSupabase, parseRequestBody, requireApiUser, successResponse } from "@/lib/api/fhir";
import { getDeveloperByUserId, maskApiKey, updateApiKeyStatus } from "@/lib/developer/service";

type UpdateApiKeyBody = {
  is_active?: boolean;
};

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const body = await parseRequestBody<UpdateApiKeyBody>(request);
  if (typeof body?.is_active !== "boolean") {
    return errorResponse("is_active must be a boolean.", 400);
  }

  const adminSupabase = getAdminSupabase();
  const developerResult = await getDeveloperByUserId(adminSupabase, auth.user.id);
  if (developerResult.error) {
    return errorResponse(developerResult.error.message, 500);
  }
  if (!developerResult.data) {
    return errorResponse("Developer profile not found.", 404);
  }

  const updateResult = await updateApiKeyStatus(adminSupabase, developerResult.data.id, id, body.is_active);
  if (updateResult.error) {
    return errorResponse(updateResult.error.message, 500);
  }
  if (!updateResult.data) {
    return errorResponse("API key not found.", 404);
  }

  return successResponse({
    ...updateResult.data,
    key: maskApiKey(updateResult.data.key),
  });
}
