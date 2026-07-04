import Link from "next/link";
import { MapPin, Edit } from "lucide-react";
import { ListingDeleteButton } from "@/components/listings/ListingDeleteButton";
import { ListingPreviewMedia } from "@/components/listings/ListingPreviewMedia";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LISTING_STATUS_LABELS } from "@/lib/listings";
import type { HostListing, ListingPhoto } from "@/types/database";

interface ListingCardProps {
  listing: HostListing;
  coverPhoto?: ListingPhoto | null;
  hostId: string;
}

export function ListingCard({ listing, coverPhoto, hostId }: ListingCardProps) {
  const status = LISTING_STATUS_LABELS[listing.status];

  return (
    <Card variant="outline" padding="sm" className="overflow-hidden group hover:shadow-md transition-shadow">
      <Link href={`/families/${listing.id}`} className="block">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black mb-4">
          <ListingPreviewMedia
            listing={listing}
            coverPhotoUrl={coverPhoto?.file_url ?? null}
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="400px"
          />
          <Badge variant={status.variant} className="absolute top-2 right-2">
            {status.label}
          </Badge>
        </div>

        <h3 className="font-semibold text-forest truncate group-hover:text-forest-light transition-colors">
          {listing.title ?? "Untitled Listing"}
        </h3>
        {(listing.city || listing.country) && (
          <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[listing.city, listing.country].filter(Boolean).join(", ")}
          </p>
        )}
      </Link>

      <div className="flex gap-2 mt-4">
        <Link href={`/host/listings/${listing.id}/edit`} className="flex-1">
          <span className="flex items-center justify-center gap-1.5 w-full rounded-full border border-sage-dark px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage/50 transition-colors">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </span>
        </Link>
        <ListingDeleteButton listingId={listing.id} hostId={hostId} title={listing.title} />
      </div>
    </Card>
  );
}
