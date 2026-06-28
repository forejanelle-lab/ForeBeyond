import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/post-login";
import type { Profile } from "@/types/database";

export default async function DashboardRedirectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "role" | "is_admin"> | null;
  redirect(getPostLoginPath(user.email ?? "", typedProfile));
}
