import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import { formatDateRange } from "@/lib/stay-requests";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { sampleImages } from "@/lib/sample-images";
import type { PublicListing, Trip } from "@/types/database";

interface UpcomingTripCardProps {
  trip: Trip;
  listing: Pick<PublicListing, "title" | "city" | "country"> | null;
  coverPhotoUrl?: string | null;
}

export function UpcomingTripCard({ trip, listing, coverPhotoUrl }: UpcomingTripCardProps) {
  const image = coverPhotoUrl ?? sampleImages.heroTravel;

  return (
    <Card variant="elevated" padding="sm" className="overflow-hidden !p-0">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[220px]">
          <Image
            src={image}
            alt={listing?.title ?? "Upcoming trip"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute top-4 left-4">
            <Badge variant="gold">Upcoming Trip</Badge>
          </div>
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-bold text-forest">
            {listing?.title ?? "Your next adventure"}
          </h2>
          {(listing?.city || listing?.country) && (
            <p className="flex items-center gap-1.5 text-sm text-charcoal-light mt-2">
              <MapPin className="h-4 w-4" />
              {[listing?.city, listing?.country].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-charcoal-light mt-2">
            <Calendar className="h-4 w-4" />
            {formatDateRange(trip.start_date, trip.end_date)}
          </p>
          <ButtonLink href={`/trips/${trip.id}`} variant="primary" size="md" className="mt-6">
            View Trip
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
