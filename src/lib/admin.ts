import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlatformAdmin } from "@/lib/navigation-menu";
import type { Profile } from "@/types/database";

export type AdminNavEntry =
  | { type: "link"; href: string; label: string }
  | { type: "section"; label: string };

export const ADMIN_NAV: AdminNavEntry[] = [
  { type: "link", href: "/admin", label: "Overview" },
  { type: "link", href: "/admin/users", label: "Users" },
  { type: "link", href: "/admin/listings", label: "Listings" },
  { type: "link", href: "/admin/verifications", label: "Verifications" },
  { type: "link", href: "/admin/reviews", label: "Reviews" },
  { type: "link", href: "/admin/reports", label: "Reports" },
  { type: "link", href: "/admin/support", label: "Support" },
  { type: "link", href: "/admin/trust-scores", label: "Trust Scores" },
  { type: "section", label: "Marketing" },
  { type: "link", href: "/admin/marketing/social-media", label: "Social Media" },
];

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

  if (!isPlatformAdmin(user.email ?? "", typedProfile?.is_admin ?? false)) {
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

export function formatAdminDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Display label for admin user tables — admins show as "admin", not their profile role. */
export function getAdminUserRoleLabel(
  user: Pick<Profile, "role" | "is_admin">
): string | null {
  if (user.is_admin) return "admin";
  return user.role ?? null;
}

/** Trust scores are not shown for platform admins. */
export function formatAdminTrustScore(
  user: Pick<Profile, "is_admin" | "trust_score">
): string | number {
  if (user.is_admin) return "—";
  return user.trust_score ?? "—";
}

export function sortableAdminTrustScore(user: Pick<Profile, "is_admin" | "trust_score">): number {
  if (user.is_admin) return -1;
  return user.trust_score ?? 0;
}
