import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function recordLoginAudit(authMethod = "password") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: "no_user" };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent = headersList.get("user-agent");

  const { error } = await supabase.rpc("record_user_login", {
    p_user_id: user.id,
    p_ip: ip,
    p_user_agent: userAgent,
    p_auth_method: authMethod,
  });

  if (error) {
    console.error("record_user_login failed:", error.message);
    return { ok: false as const, reason: error.message };
  }

  return { ok: true as const };
}
