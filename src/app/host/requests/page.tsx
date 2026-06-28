import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateHostEarnings, LISTING_PRICING_SELECT, pickListingPricing, type ListingPricing } from "@/lib/stay-requests";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import { PageShell } from "@/components/layout/PageShell";
import { HostRequestsList, type HostRequestRow } from "@/components/stays/HostRequestsList";
import type { Profile, HostListing, StayRequest } from "@/types/database";

export const metadata = { title: "Requests" };

export default async function HostRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/requests");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as Pick<Profile, "role"> | null)?.role !== "host") {
    redirect("/trips");
  }

  const { data: requests } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const typedRequests = (requests as StayRequest[]) ?? [];
  const listingIds = [...new Set(typedRequests.map((r) => r.listing_id).filter(Boolean) as string[])];
  const travelerIds = [...new Set(typedRequests.map((r) => r.traveler_id))];

  const [{ data: listings }, { data: travelers }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("host_listings").select(`id, title, ${LISTING_PRICING_SELECT}`).in("id", listingIds)
      : Promise.resolve({ data: [] }),
    travelerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", travelerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const listingMap = Object.fromEntries(
    ((listings as (Pick<HostListing, "id" | "title"> & ListingPricing)[]) ?? []).map((l) => [
      l.id,
      l,
    ])
  );
  const travelerMap = Object.fromEntries(
    ((travelers as { id: string; full_name: string | null }[]) ?? []).map((t) => [
      t.id,
      t.full_name,
    ])
  );

  const rows: HostRequestRow[] = typedRequests.map((request) => {
    const listing = request.listing_id ? listingMap[request.listing_id] : null;
    const listingPricing = pickListingPricing(listing ?? {});
    const incomeTotal =
      request.start_date && request.end_date
        ? calculateHostEarnings(
            listingPricing,
            request.start_date,
            request.end_date,
            request.guest_count
          )?.netEarnings ?? null
        : null;

    return {
      request,
      travelerId: request.traveler_id,
      travelerName: formatMemberDisplayName(travelerMap[request.traveler_id], {
        fallback: "Traveler",
        stayStatus: request.status,
      }),
      listingTitle: listing?.title?.trim() || "Untitled listing",
      listingPricing,
      incomeTotal,
    };
  });

  const pending = rows.filter((r) => r.request.status === "pending").length;
  const active = rows.filter(
    (r) => r.request.status === "approved" || r.request.status === "host_approved"
  ).length;

  return (
    <PageShell
      title="Requests"
      subtitle={`${active} in progress · ${pending} pending · ${rows.length} total`}
    >
      <HostRequestsList requests={rows} />
    </PageShell>
  );
}
