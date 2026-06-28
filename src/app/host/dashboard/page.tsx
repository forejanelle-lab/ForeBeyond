import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/post-login";
import type { Profile } from "@/types/database";

export default async function HostDashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  redirect(getPostLoginPath(user.email ?? "", profile as Pick<Profile, "is_admin" | "role"> | null));
}
