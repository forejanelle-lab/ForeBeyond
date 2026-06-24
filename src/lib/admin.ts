import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/hosts", label: "Hosts" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/trust-scores", label: "Trust Scores" },
] as const;

export async function requireAdmin(
  supabase: SupabaseClient,
  redirectPath = "/admin"
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?redirect=${redirectPath}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, is_trust_moderator, role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<
    Profile,
    "id" | "full_name" | "email" | "is_admin" | "is_trust_moderator" | "role"
  > | null;

  if (!typedProfile?.is_admin) {
    notFound();
  }

  return { user, profile: typedProfile };
}

export function formatAdminDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
