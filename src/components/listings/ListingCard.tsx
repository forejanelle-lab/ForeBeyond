import Link from "next/link";
import Image from "next/image";
import { MapPin, Edit, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LISTING_STATUS_LABELS } from "@/lib/listings";
import type { HostListing, ListingPhoto } from "@/types/database";

interface ListingCardProps {
  listing: HostListing;
  coverPhoto?: ListingPhoto | null;
}

export function ListingCard({ listing, coverPhoto }: ListingCardProps) {
  const status = LISTING_STATUS_LABELS[listing.status];

  return (
    <Card variant="outline" padding="sm" className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-sage mb-4">
        {coverPhoto ? (
          <Image
            src={coverPhoto.file_url}
            alt={listing.title ?? "Listing"}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-charcoal-light text-sm">
            No photos yet
          </div>
        )}
        <Badge variant={status.variant} className="absolute top-2 right-2">
          {status.label}
        </Badge>
      </div>

      <h3 className="font-semibold text-forest truncate">
        {listing.title ?? "Untitled Listing"}
      </h3>
      {(listing.city || listing.country) && (
        <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[listing.city, listing.country].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <Link href={`/host/listings/${listing.id}/edit`} className="flex-1">
          <span className="flex items-center justify-center gap-1.5 w-full rounded-full border border-sage-dark px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage/50 transition-colors">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </span>
        </Link>
        {listing.status === "published" && (
          <Link href={`/families/${listing.id}`}>
            <span className="flex items-center justify-center gap-1.5 rounded-full border border-sage-dark px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage/50 transition-colors">
              <Eye className="h-3.5 w-3.5" />
              View
            </span>
          </Link>
        )}
      </div>
    </Card>
  );
}
