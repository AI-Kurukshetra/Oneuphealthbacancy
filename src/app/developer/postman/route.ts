import { buildPostmanCollection } from "@/lib/developer/catalog";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  return new Response(JSON.stringify(buildPostmanCollection(origin), null, 2), {
    headers: {
      "Content-Disposition": 'attachment; filename="healthbridge-postman-collection.json"',
      "Content-Type": "application/json",
    },
  });
}
