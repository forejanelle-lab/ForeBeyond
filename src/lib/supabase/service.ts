import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

export const SUPABASE_SERVICE_ROLE_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in .env.local (local) or Vercel Environment Variables (production).";

export function createServiceClient(): SupabaseClient {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!env || !serviceRoleKey) {
    throw new Error(SUPABASE_SERVICE_ROLE_MESSAGE);
  }

  return createClient(env.url, serviceRoleKey);
}
