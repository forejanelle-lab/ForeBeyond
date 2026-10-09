import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { formatReferralAttribution } from "@/lib/referral";
import type { Profile, ReferralLink, StayBooking } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Users",
  description: "Manage platform users in Fore Beyond admin.",
  path: "/admin/users",
});

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, is_admin, verification_status, trust_score, created_at, last_login_at, last_active_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows =
    (users as Pick<
      Profile,
      | "id"
      | "full_name"
      | "email"
      | "role"
      | "is_admin"
      | "verification_status"
      | "trust_score"
      | "created_at"
      | "last_login_at"
      | "last_active_at"
    >[]) ?? [];

  const userIds = rows.map((user) => user.id);
  const { data: referredBookings, error: referralError } = userIds.length
    ? await supabase
        .from("stay_bookings")
        .select("traveler_id, referral_link_id, created_at")
        .in("traveler_id", userIds)
        .not("referral_link_id", "is", null)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (referralError) {
    const usersWithReferral = rows.map((user) => ({ ...user, referralLabel: null }));
    return (
      <AdminShell wide title="Users" description="Search, filter, and manage platform members.">
        <Suspense fallback={<p className="text-sm text-charcoal-light">Loading users…</p>}>
          <AdminUsersPanel users={usersWithReferral} />
        </Suspense>
      </AdminShell>
    );
  }

  const latestReferralByUser = new Map<string, string>();
  for (const booking of (referredBookings as Pick<
    StayBooking,
    "traveler_id" | "referral_link_id" | "created_at"
  >[]) ?? []) {
    if (!booking.referral_link_id || latestReferralByUser.has(booking.traveler_id)) continue;
    latestReferralByUser.set(booking.traveler_id, booking.referral_link_id);
  }

  const referralIds = [...new Set(latestReferralByUser.values())];
  const { data: referralLinks } = referralIds.length
    ? await supabase.from("referral_links").select("id, name, code").in("id", referralIds)
    : { data: [] };

  const referralById = Object.fromEntries(
    ((referralLinks as Pick<ReferralLink, "id" | "name" | "code">[]) ?? []).map((link) => [
      link.id,
      formatReferralAttribution(link),
    ])
  );

  const usersWithReferral = rows.map((user) => {
    const referralId = latestReferralByUser.get(user.id);
    return {
      ...user,
      referralLabel: referralId ? referralById[referralId] ?? null : null,
    };
  });

  return (
    <AdminShell wide title="Users" description="Search, filter, and manage platform members.">
      <Suspense fallback={<p className="text-sm text-charcoal-light">Loading users…</p>}>
        <AdminUsersPanel users={usersWithReferral} />
      </Suspense>
    </AdminShell>
  );
}
