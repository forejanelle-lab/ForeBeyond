"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/post-login";
import type { Profile } from "@/types/database";

export async function recordLoginAudit(authMethod = "password") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent = headersList.get("user-agent");

  await supabase.rpc("record_user_login", {
    p_user_id: user.id,
    p_ip: ip,
    p_user_agent: userAgent,
    p_auth_method: authMethod,
  }).then(({ error }) => {
    if (error) {
      console.error("record_user_login failed:", error.message);
    }
  });
}

export async function resolvePostLoginRedirect(redirectParam: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/auth/sign-in";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "is_admin" | "role"> | null;

  return getPostLoginPath(user.email ?? "", typedProfile, redirectParam);
}
