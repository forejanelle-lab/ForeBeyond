import { redirect, notFound } from "next/navigation";

/** Review moderation moved to admin — legacy URL redirects platform admins. */
export default async function ReviewModerationRedirect() {
  const { createClient } = await import("@/lib/supabase/server");
  const { isPlatformAdmin } = await import("@/lib/navigation-menu");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/admin/reviews");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!isPlatformAdmin(user.email ?? "", profile?.is_admin ?? false)) {
    notFound();
  }

  redirect("/admin/reviews");
}
