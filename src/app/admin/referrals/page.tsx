import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminReferralsPanel } from "@/components/admin/AdminReferralsPanel";
import { ReferralSetupBanner } from "@/components/admin/ReferralSetupBanner";
import { isReferralSchemaReady } from "@/lib/referral-schema-ready";
import { privatePageMetadata } from "@/lib/site-metadata";
import type { ReferralLink, StayBooking } from "@/types/database";

export const metadata = privatePageMetadata({
  title: "Admin — Referrals",
  description: "Create and manage Fore Beyond referral links.",
  path: "/admin/referrals",
});

export default async function AdminReferralsPage() {
  const supabase = await createClient();
  const schemaReady = await isReferralSchemaReady(supabase);

  if (!schemaReady) {
    return (
      <AdminShell
        title="Referral links"
        description="Create shareable links. When a traveler books a stay after clicking one, the partner name appears on their user page."
      >
        <ReferralSetupBanner />
      </AdminShell>
    );
  }

  const { data: links } = await supabase
    .from("referral_links")
    .select("id, name, code, is_active, created_by, created_at, updated_at")
    .order("created_at", { ascending: false });

  const rows = (links as ReferralLink[]) ?? [];
  const linkIds = rows.map((link) => link.id);

  const { data: bookings } = linkIds.length
    ? await supabase.from("stay_bookings").select("referral_link_id").in("referral_link_id", linkIds)
    : { data: [] };

  const bookingCountByLink = new Map<string, number>();
  for (const booking of (bookings as Pick<StayBooking, "referral_link_id">[]) ?? []) {
    if (!booking.referral_link_id) continue;
    bookingCountByLink.set(
      booking.referral_link_id,
      (bookingCountByLink.get(booking.referral_link_id) ?? 0) + 1
    );
  }

  return (
    <AdminShell
      title="Referral links"
      description="Create shareable links. When a traveler books a stay after clicking one, the partner name appears on their user page."
    >
      <AdminReferralsPanel
        links={rows.map((link) => ({
          ...link,
          booking_count: bookingCountByLink.get(link.id) ?? 0,
        }))}
      />
    </AdminShell>
  );
}
