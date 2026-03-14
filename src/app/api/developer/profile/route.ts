import { getAdminSupabase, requireApiUser, successResponse } from "@/lib/api/fhir";
import { getDeveloperProfilePayload } from "@/lib/developer/service";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  return successResponse(await getDeveloperProfilePayload(getAdminSupabase(), auth.user.id));
}
