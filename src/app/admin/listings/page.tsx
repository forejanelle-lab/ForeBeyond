import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminListingPanel } from "@/components/admin/AdminListingPanel";
import type { HostListing, Profile } from "@/types/database";

export const metadata = { title: "Admin — Listings" };

export default async function AdminListingsPage() {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("host_listings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);

  const typedListings = (listings as HostListing[]) ?? [];
  const hostIds = [...new Set(typedListings.map((l) => l.host_id))];
  const { data: hosts } = hostIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", hostIds)
    : { data: [] };

  const hostMap = new Map(
    (hosts as Pick<Profile, "id" | "full_name">[] | null)?.map((h) => [h.id, h.full_name]) ?? []
  );

  const rows = typedListings.map((listing) => ({
    ...listing,
    host_name: hostMap.get(listing.host_id) ?? null,
  }));

  return (
    <AdminShell title="Listings" description="Publish, archive, and moderate family listings.">
      <AdminListingPanel listings={rows} />
    </AdminShell>
  );
}
