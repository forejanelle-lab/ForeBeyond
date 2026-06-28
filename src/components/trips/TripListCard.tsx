import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { formatCurrency, formatDateRange, TRIP_STATUS_LABELS } from "@/lib/stay-requests";
import { ListingImage } from "@/components/listings/ListingImage";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PublicListing, StayBooking, Trip } from "@/types/database";

interface TripListCardProps {
  trip: Trip;
  listing: Pick<PublicListing, "title" | "city" | "country"> | null;
  listingId?: string | null;
  booking?: Pick<StayBooking, "total_amount" | "payment_status"> | null;
  coverPhotoUrl?: string | null;
}

export function TripListCard({
  trip,
  listing,
  listingId,
  booking,
  coverPhotoUrl,
}: TripListCardProps) {
  const status = TRIP_STATUS_LABELS[trip.status] ?? TRIP_STATUS_LABELS.upcoming;
  const tripHref = `/trips/${trip.id}`;
  const familyHref = listingId ? `/families/${listingId}` : null;

  return (
    <Card variant="outline" padding="sm" className="overflow-hidden !p-0 hover:shadow-md transition-shadow h-full">
      <Link href={tripHref} className="block group">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="relative w-full h-44 sm:w-48 md:w-56 shrink-0 self-stretch min-h-[140px] overflow-hidden bg-sage">
            <ListingImage
              src={coverPhotoUrl}
              country={listing?.country}
              city={listing?.city}
              alt={listing?.title ?? "Trip"}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 224px"
            />
          </div>
          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {booking && (
                <span className="text-sm font-medium text-forest">
                  {formatCurrency(booking.total_amount)}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-forest group-hover:text-forest-light transition-colors">
              {listing?.title ?? "Trip"}
            </h3>
            {listing && (listing.city || listing.country) && (
              <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {[listing.city, listing.country].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="flex items-center gap-1 text-sm text-charcoal-light mt-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
            <p className="text-xs text-forest mt-2">View booking details →</p>
          </div>
        </div>
      </Link>
      {familyHref && (
        <div className="border-t border-sage-dark/20 px-4 py-3 bg-sage/10">
          <Link
            href={familyHref}
            className="text-xs font-medium text-forest hover:underline"
          >
            View family listing →
          </Link>
        </div>
      )}
    </Card>
  );
}
