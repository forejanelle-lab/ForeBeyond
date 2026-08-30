"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { ListingImage } from "@/components/listings/ListingImage";
import { isListingLogoFallbackUrl } from "@/lib/listing-images";
import type { ListingPhoto } from "@/types/database";

interface ListingPhotoGalleryProps {
  photos: ListingPhoto[];
  country?: string | null;
  city?: string | null;
  title?: string | null;
}

export function ListingPhotoGallery({
  photos,
  country,
  city,
  title,
}: ListingPhotoGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const uploaded = photos.filter((photo) => !isListingLogoFallbackUrl(photo.file_url));
  const displayPhotos = uploaded.length > 0 ? uploaded : photos.slice(0, 1);

  if (displayPhotos.length === 0) {
    return (
      <div className="aspect-[16/9] md:aspect-[2.2/1] rounded-2xl bg-sage/60 flex items-center justify-center">
        <Images className="h-10 w-10 text-charcoal-light/40" aria-hidden />
      </div>
    );
  }

  const hero = displayPhotos[0];
  const secondary = displayPhotos.slice(1, 3);
  const altBase = title ?? "Host family home";

  if (showAll) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-charcoal-light">
            {displayPhotos.length} photos
          </p>
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="text-sm font-medium text-forest hover:underline"
          >
            Back to gallery
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sage"
            >
              <ListingImage
                src={photo.file_url}
                country={country}
                city={city}
                alt={photo.caption ?? altBase}
                fill
                showLogoFallback={false}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet grid */}
      <div className="relative hidden md:block">
      <div className="grid md:grid-cols-[1.6fr_1fr] gap-3 md:gap-4 md:aspect-[2.2/1]">
        <div className="relative rounded-2xl overflow-hidden bg-sage min-h-[280px]">
          <ListingImage
            src={hero.file_url}
            country={country}
            city={city}
            alt={hero.caption ?? altBase}
            fill
            priority
            showLogoFallback={false}
            className="object-cover"
            sizes="(max-width: 1024px) 60vw, 45vw"
          />
        </div>
        <div className="grid grid-rows-2 gap-3 md:gap-4 min-h-0">
          {secondary.length > 0 ? (
            secondary.map((photo) => (
              <div
                key={photo.id}
                className="relative rounded-2xl overflow-hidden bg-sage min-h-0"
              >
                <ListingImage
                  src={photo.file_url}
                  country={country}
                  city={city}
                  alt={photo.caption ?? altBase}
                  fill
                  showLogoFallback={false}
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-2xl bg-sage/50" />
              <div className="rounded-2xl bg-sage/50" />
            </>
          )}
        </div>
      </div>
        {displayPhotos.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-charcoal shadow-md hover:bg-white transition-colors"
          >
            <Images className="h-4 w-4" />
            View all photos
          </button>
        )}
      </div>

      {/* Mobile swipeable strip */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          {displayPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative shrink-0 w-[88vw] max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-sage snap-center"
            >
              <ListingImage
                src={photo.file_url}
                country={country}
                city={city}
                alt={photo.caption ?? altBase}
                fill
                priority={index === 0}
                showLogoFallback={false}
                className="object-cover"
                sizes="88vw"
              />
            </div>
          ))}
        </div>
        {displayPhotos.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline"
          >
            <Images className="h-4 w-4" />
            View all {displayPhotos.length} photos
          </button>
        )}
      </div>
    </>
  );
}
