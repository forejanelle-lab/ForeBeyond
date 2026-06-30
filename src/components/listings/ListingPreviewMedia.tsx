"use client";

import type { PublicListing } from "@/types/database";
import { ListingImage } from "@/components/listings/ListingImage";

interface ListingPreviewMediaProps {
  listing: Pick<PublicListing, "country" | "city" | "title" | "intro_video_url">;
  coverPhotoUrl?: string | null;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ListingPreviewMedia({
  listing,
  coverPhotoUrl,
  fill = true,
  className = "object-cover",
  sizes,
  priority,
}: ListingPreviewMediaProps) {
  if (listing.intro_video_url) {
    return (
      <video
        src={listing.intro_video_url}
        muted
        loop
        playsInline
        autoPlay
        className={`absolute inset-0 h-full w-full ${className}`}
        aria-label={listing.title ?? "Family intro video"}
      />
    );
  }

  return (
    <ListingImage
      src={coverPhotoUrl}
      country={listing.country}
      city={listing.city}
      alt={listing.title ?? "Family listing"}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
