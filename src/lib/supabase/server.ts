import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv, SUPABASE_CONFIG_MESSAGE } from "@/lib/env";

export async function createClient(): Promise<SupabaseClient> {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(SUPABASE_CONFIG_MESSAGE);
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
