"use client";

import { ListingImage } from "@/components/listings/ListingImage";

interface SearchCardPhotoGalleryProps {
  photos: string[];
  country?: string | null;
  city?: string | null;
  title?: string | null;
}

export function SearchCardPhotoGallery({
  photos,
  country,
  city,
  title,
}: SearchCardPhotoGalleryProps) {
  const altBase = title ?? "Host family home";

  if (photos.length === 0) {
    return (
      <div className="relative aspect-[16/10] md:aspect-auto md:h-full md:min-h-[220px] md:max-h-[260px] rounded-[18px] overflow-hidden bg-sage/50">
        <ListingImage
          src={null}
          country={country}
          city={city}
          alt={altBase}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 45vw"
        />
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div className="relative aspect-[16/10] md:aspect-auto md:h-full md:min-h-[220px] md:max-h-[260px] rounded-[18px] overflow-hidden bg-sage">
        <ListingImage
          src={photos[0]}
          country={country}
          city={city}
          alt={altBase}
          fill
          priority
          showLogoFallback={false}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 45vw"
        />
      </div>
    );
  }

  const [primary, ...secondary] = photos;

  return (
    <>
      {/* Mobile: swipeable strip */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-hide -mx-1 px-1">
          {photos.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative shrink-0 w-[88%] aspect-[16/10] rounded-[18px] overflow-hidden bg-sage snap-center"
            >
              <ListingImage
                src={url}
                country={country}
                city={city}
                alt={altBase}
                fill
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                showLogoFallback={false}
                className="object-cover"
                sizes="88vw"
              />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden>
            {photos.map((url, index) => (
              <span
                key={`dot-${url}-${index}`}
                className={`h-1.5 rounded-full ${index === 0 ? "w-4 bg-forest" : "w-1.5 bg-sage-dark/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: large + stacked secondary */}
      <div className="hidden md:grid md:grid-cols-[1.55fr_1fr] gap-2.5 h-full min-h-[220px] max-h-[260px]">
        <div className="relative rounded-[18px] overflow-hidden bg-sage min-h-0">
          <ListingImage
            src={primary}
            country={country}
            city={city}
            alt={altBase}
            fill
            priority
            showLogoFallback={false}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="28vw"
          />
        </div>
        <div
          className={`grid min-h-0 h-full ${secondary.length >= 2 ? "grid-rows-2 gap-2.5" : "grid-rows-1"}`}
        >
          {secondary.slice(0, 2).map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative rounded-[18px] overflow-hidden bg-sage min-h-0"
            >
              <ListingImage
                src={url}
                country={country}
                city={city}
                alt={altBase}
                fill
                loading="lazy"
                showLogoFallback={false}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="14vw"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
