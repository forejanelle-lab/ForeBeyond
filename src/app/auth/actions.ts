"use server";

import { recordLoginAudit as recordLoginAuditImpl } from "@/lib/record-login-audit";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/post-login";
import type { Profile } from "@/types/database";

export async function recordLoginAudit(authMethod = "password") {
  await recordLoginAuditImpl(authMethod);
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
