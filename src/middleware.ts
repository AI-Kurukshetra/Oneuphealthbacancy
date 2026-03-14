import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function createMiddlewareSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function consumeRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - bucket.count, resetAt: bucket.resetAt };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/api/openapi" || pathname.startsWith("/api/developer")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";

  if (!token.startsWith("hb_live_")) {
    return NextResponse.next();
  }

  const supabase = createMiddlewareSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Developer API authentication is not configured." }, { status: 500 });
  }

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("id, developer_id, is_active")
    .eq("key", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Invalid API key." }, { status: 401 });
  }

  const clientAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const bucket = consumeRateLimit(`${apiKey.id}:${clientAddress}`);

  if (!bucket.allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded." },
      {
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
        },
        status: 429,
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(bucket.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
