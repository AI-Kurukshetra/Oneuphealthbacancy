import { buildOpenApiSpec } from "@/lib/developer/catalog";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return Response.json(buildOpenApiSpec(origin));
}
