import type { SupabaseClient } from "@supabase/supabase-js";

/** True when Host Finder tables exist (migration 075 applied). */
export async function isHostFinderSchemaReady(
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase.from("host_searches").select("id").limit(1);
  if (!error) return true;
  if (error.code === "PGRST205") return false;
  return true;
}

export function isHostFinderSchemaError(message: string | undefined): boolean {
  return Boolean(message?.includes("host_searches") && message.includes("schema cache"));
}
