import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TRIP_STATUS_LABELS, formatDateRange, formatCurrency } from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { PublicListing, StayBooking, Trip } from "@/types/database";

export const metadata = { title: "My Trips" };

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/trips");

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const typedTrips = (trips as Trip[]) ?? [];
  const listingIds = [...new Set(typedTrips.map((t) => t.listing_id).filter(Boolean) as string[])];
  const tripIds = typedTrips.map((t) => t.id);

  const [{ data: listings }, { data: bookings }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("public_listings").select("id, title, city, country").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    tripIds.length > 0
      ? supabase.from("stay_bookings").select("trip_id, total_amount, payment_status").in("trip_id", tripIds)
      : Promise.resolve({ data: [] }),
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

  return (
    <Container className="py-10 md:py-16">
      <h1 className="text-3xl font-bold text-forest">My trips</h1>
      <p className="mt-2 text-charcoal-light mb-8">{typedTrips.length} trip{typedTrips.length !== 1 ? "s" : ""}</p>

      {typedTrips.length === 0 ? (
        <Card variant="outline" padding="lg" className="text-center py-12">
          <p className="text-charcoal-light">No trips yet. Request a stay with a host family to get started.</p>
          <Link href="/search" className="inline-block mt-4 text-sm font-medium text-forest hover:underline">
            Browse families
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typedTrips.map((trip) => {
            const listing = trip.listing_id ? listingMap[trip.listing_id] : null;
            const booking = bookingMap[trip.id];
            const status = TRIP_STATUS_LABELS[trip.status] ?? TRIP_STATUS_LABELS.upcoming;

            return (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="block group">
                <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {booking && (
                      <span className="text-sm font-medium text-forest">
                        {formatCurrency(booking.total_amount)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-forest group-hover:text-forest-light">
                    {listing?.title ?? "Trip"}
                  </h3>
                  {listing && (listing.city || listing.country) && (
                    <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[listing.city, listing.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-charcoal-light mt-2">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
