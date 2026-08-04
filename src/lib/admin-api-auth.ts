import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";
import type { Profile } from "@/types/database";

export async function requireAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "id" | "email" | "is_admin"> | null;

  if (!isPlatformAdmin(user.email ?? "", typedProfile?.is_admin ?? false)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return { supabase, user, profile: typedProfile } as const;
}
