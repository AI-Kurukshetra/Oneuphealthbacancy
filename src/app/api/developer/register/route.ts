import { errorResponse, getAdminSupabase, parseRequestBody, requireApiUser, successResponse } from "@/lib/api/fhir";
import { registerDeveloper } from "@/lib/developer/service";

type RegisterDeveloperBody = {
  organization_name?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseRequestBody<RegisterDeveloperBody>(request);
  if (!body?.organization_name?.trim()) {
    return errorResponse("organization_name is required.", 400);
  }

  const { data, error } = await registerDeveloper(getAdminSupabase(), auth.user.id, body.organization_name.trim());
  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
}
