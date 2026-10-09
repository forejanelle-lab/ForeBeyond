import type { SupabaseClient } from "@supabase/supabase-js";

/** True when referral_links exists (migration 079 applied). */
export async function isReferralSchemaReady(supabase: SupabaseClient) {
  const { error } = await supabase.from("referral_links").select("id").limit(1);
  if (!error) return true;
  if (error.code === "PGRST205") return false;
  if (/referral_links|schema cache/i.test(error.message)) return false;
  return true;
}
