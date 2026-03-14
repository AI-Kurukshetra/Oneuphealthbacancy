"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";

export const getClientSupabase = () => createClientComponentClient<Database>();
