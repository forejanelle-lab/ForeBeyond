"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { LISTING_IMAGE_FALLBACK, resolveListingImage } from "@/lib/listing-images";

type ListingImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  country?: string | null;
  city?: string | null;
};

export function ListingImage({
  src,
  alt,
  country,
  city,
  unoptimized,
  onError,
  ...props
}: ListingImageProps) {
  const resolved = resolveListingImage(src, country, city);
  const isLogoFallback = resolved === LISTING_IMAGE_FALLBACK;
  const [imgSrc, setImgSrc] = useState(resolved);
  const [useLogo, setUseLogo] = useState(isLogoFallback);

  useEffect(() => {
    const next = resolveListingImage(src, country, city);
    setImgSrc(next);
    setUseLogo(next === LISTING_IMAGE_FALLBACK);
  }, [src, country, city]);

  function handleError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
    if (!useLogo && imgSrc !== LISTING_IMAGE_FALLBACK) {
      setUseLogo(true);
      setImgSrc(LISTING_IMAGE_FALLBACK);
      return;
    }
    onError?.(event);
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={unoptimized ?? imgSrc.startsWith("http")}
      onError={handleError}
      className={
        useLogo
          ? `${props.className ?? ""} object-contain bg-sage p-6`.trim()
          : props.className
      }
    />
  );
}
