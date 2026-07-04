import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { TripsListView } from "@/components/trips/TripsListView";
import { TravelerPendingRequestsList } from "@/components/trips/TravelerPendingRequestsList";
import type { TravelerPendingRequestRow } from "@/components/trips/TravelerPendingRequestTable";
import {
  calculateStayWithServiceFee,
  LISTING_PRICING_SELECT,
  pickListingPricing,
  type ListingPricing,
} from "@/lib/stay-requests";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import type { ListingPhoto, Profile, PublicListing, StayBooking, StayRequest, Trip } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "My Trips",
  description: "View and manage your upcoming and past trips on Fore Beyond.",
  path: "/trips",
});

async function getCoverPhotos(listingIds: string[]) {
  if (listingIds.length === 0) return {};

  const supabase = await createClient();
  const { data: photos, error } = await supabase
    .from("listing_photos")
    .select("listing_id, file_url, is_cover, sort_order")
    .in("listing_id", listingIds)
    .order("is_cover", { ascending: false })
    .order("sort_order");

  if (error) return {};

  const coverMap: Record<string, string> = {};
  (photos as Pick<ListingPhoto, "listing_id" | "file_url" | "is_cover">[] | null)?.forEach(
    (photo) => {
      if (!photo.file_url) return;
      if (photo.is_cover || !coverMap[photo.listing_id]) {
        coverMap[photo.listing_id] = photo.file_url;
      }
    }
  );

  return coverMap;
}

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/trips");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as Pick<Profile, "role"> | null)?.role;
  if (role === "host") redirect("/host/requests");
  if (role !== "traveler") redirect("/profile/complete");

  const [{ data: trips }, { data: pendingRequests }] = await Promise.all([
    supabase
      .from("trips")
      .select("*")
      .eq("traveler_id", user.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("stay_requests")
      .select("*")
      .eq("traveler_id", user.id)
      .in("status", ["pending", "host_approved"])
      .order("created_at", { ascending: false }),
  ]);

  const typedTrips = (trips as Trip[]) ?? [];
  const typedPending = (pendingRequests as StayRequest[]) ?? [];
  const listingIds = [
    ...new Set([
      ...typedTrips.map((t) => t.listing_id).filter(Boolean) as string[],
      ...typedPending.map((r) => r.listing_id).filter(Boolean) as string[],
    ]),
  ];
  const tripIds = typedTrips.map((t) => t.id);
  const pendingHostIds = [...new Set(typedPending.map((r) => r.host_id))];

  const [{ data: listings }, { data: bookings }, { data: hostProfiles }, coverPhotos] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("public_listings").select(`id, title, city, country, host_id, host_first_name, pricing_currency, ${LISTING_PRICING_SELECT}`)
          .in("id", listingIds)
      : Promise.resolve({ data: [] }),
    tripIds.length > 0
      ? supabase.from("stay_bookings").select("trip_id, total_amount, payment_status, stripe_payment_intent_id").in("trip_id", tripIds)
      : Promise.resolve({ data: [] }),
    pendingHostIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", pendingHostIds)
      : Promise.resolve({ data: [] }),
    getCoverPhotos(listingIds),
  ]);

  const hostFullNameById = Object.fromEntries(
    ((hostProfiles as { id: string; full_name: string | null }[]) ?? []).map((p) => [p.id, p.full_name])
  );

  const listingMap = Object.fromEntries(
    ((listings as (Pick<PublicListing, "id" | "title" | "city" | "country" | "host_id" | "host_first_name" | "pricing_currency"> & ListingPricing)[]) ?? []).map(
      (l) => [l.id, l]
    )
  );
  const bookingMap = Object.fromEntries(
    ((bookings as Pick<StayBooking, "trip_id" | "total_amount" | "payment_status" | "stripe_payment_intent_id">[]) ?? []).map((b) => [
      b.trip_id,
      b,
    ])
  );

  const rows = typedTrips.map((trip) => ({
    ...trip,
    listing: trip.listing_id ? listingMap[trip.listing_id] ?? null : null,
    booking: bookingMap[trip.id] ?? null,
    coverPhotoUrl: trip.listing_id ? coverPhotos[trip.listing_id] ?? null : null,
  }));

  const pendingRows: TravelerPendingRequestRow[] = typedPending.map((request) => {
    const listing = request.listing_id ? listingMap[request.listing_id] : null;
    const listingPricing = pickListingPricing(listing ?? {});
    const stayTotal =
      request.start_date && request.end_date
        ? calculateStayWithServiceFee(
            listingPricing,
            request.start_date,
            request.end_date,
            request.guest_count
          )?.subtotal ?? null
        : null;

    return {
      request,
      listingTitle: listing?.title?.trim() || "Host family",
      location: listing
        ? [listing.city, listing.country].filter(Boolean).join(", ") || null
        : null,
      hostName: formatMemberDisplayName(hostFullNameById[request.host_id], {
        fallback: listing?.host_first_name ?? "Host",
        stayStatus: request.status,
      }),
      stayTotal,
      hostCountry: listing?.country ?? null,
      pricingCurrency: listing?.pricing_currency ?? null,
    };
  });

  return (
    <PageShell
      title="My trips"
      subtitle={`${pendingRows.length} pending request${pendingRows.length !== 1 ? "s" : ""} · ${typedTrips.length} confirmed trip${typedTrips.length !== 1 ? "s" : ""}`}
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-forest">Pending requests</h2>
            <p className="text-sm text-charcoal-light mt-1">
              Stay requests waiting for host review or your confirmation.
            </p>
          </div>
          <TravelerPendingRequestsList requests={pendingRows} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-forest">Confirmed trips</h2>
            <p className="text-sm text-charcoal-light mt-1">
              Approved stays with booking details.
            </p>
          </div>
          <TripsListView trips={rows} />
        </section>
      </div>
    </PageShell>
  );
}
