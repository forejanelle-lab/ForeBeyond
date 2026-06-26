import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { TripsListView } from "@/components/trips/TripsListView";
import type { ListingPhoto, Profile, PublicListing, StayBooking, Trip } from "@/types/database";

export const metadata = { title: "My Trips" };

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

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("traveler_id", user.id)
    .order("start_date", { ascending: false });

  const typedTrips = (trips as Trip[]) ?? [];
  const listingIds = [...new Set(typedTrips.map((t) => t.listing_id).filter(Boolean) as string[])];
  const tripIds = typedTrips.map((t) => t.id);

  const [{ data: listings }, { data: bookings }, coverPhotos] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("public_listings").select("id, title, city, country").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    tripIds.length > 0
      ? supabase.from("stay_bookings").select("trip_id, total_amount, payment_status").in("trip_id", tripIds)
      : Promise.resolve({ data: [] }),
    getCoverPhotos(listingIds),
  ]);

  const listingMap = Object.fromEntries(
    ((listings as Pick<PublicListing, "id" | "title" | "city" | "country">[]) ?? []).map((l) => [l.id, l])
  );
  const bookingMap = Object.fromEntries(
    ((bookings as Pick<StayBooking, "trip_id" | "total_amount" | "payment_status">[]) ?? []).map((b) => [
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

  return (
    <PageShell
      title="My trips"
      subtitle={`${typedTrips.length} trip${typedTrips.length !== 1 ? "s" : ""}`}
    >
      <TripsListView trips={rows} />
    </PageShell>
  );
}
