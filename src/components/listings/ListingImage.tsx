"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { LISTING_IMAGE_FALLBACK, resolveListingImage } from "@/lib/listing-images";
import { ListingLogoFallbackImage } from "@/components/listings/ListingLogoFallbackImage";

function stripObjectFitClasses(className: string): string {
  return className
    .replace(/\bobject-(cover|contain|fill|none|scale-down)\b/g, "")
    .replace(/\bobject-(center|top|bottom|left|right|left-top|left-bottom|right-top|right-bottom)\b/g, "")
    .replace(/\bobject-\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type ListingImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  country?: string | null;
  city?: string | null;
  /** When false, missing/broken images render as empty sage (e.g. photo galleries). */
  showLogoFallback?: boolean;
};

export function ListingImage({
  src,
  alt,
  country,
  city,
  showLogoFallback = true,
  unoptimized,
  onError,
  className = "",
  fill,
  ...props
}: ListingImageProps) {
  const resolved = resolveListingImage(src, country, city, {
    fallback: showLogoFallback ? "logo" : "none",
  });
  const isLogoFallback = resolved === LISTING_IMAGE_FALLBACK;
  const [imgSrc, setImgSrc] = useState(resolved);
  const [useLogo, setUseLogo] = useState(isLogoFallback);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = resolveListingImage(src, country, city, {
      fallback: showLogoFallback ? "logo" : "none",
    });
    setImgSrc(next);
    setUseLogo(next === LISTING_IMAGE_FALLBACK);
    setFailed(false);
  }, [src, country, city, showLogoFallback]);

  function handleError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
    if (showLogoFallback && !useLogo && imgSrc !== LISTING_IMAGE_FALLBACK) {
      setUseLogo(true);
      setImgSrc(LISTING_IMAGE_FALLBACK);
      return;
    }
    setFailed(true);
    onError?.(event);
  }

  const motionClassName = stripObjectFitClasses(className);

  if (!imgSrc || failed) {
    return (
      <div
        aria-hidden
        className={`bg-sage ${fill ? "absolute inset-0" : ""} ${className}`.trim()}
      />
    );
  }

  if (useLogo && !fill) {
    return (
      <div className={`relative overflow-hidden bg-gray-200 ${className}`.trim()}>
        <ListingLogoFallbackImage sizes={props.sizes} priority={props.priority} />
      </div>
    );
  }

  if (useLogo && fill) {
    return (
      <div
        className={`absolute inset-0 overflow-hidden bg-gray-200 ${motionClassName}`.trim()}
      >
        <ListingLogoFallbackImage sizes={props.sizes} priority={props.priority} />
      </div>
    );
  }

  return (
    <Image
      {...props}
      fill={fill}
      src={imgSrc}
      alt={alt}
      unoptimized={unoptimized ?? imgSrc.startsWith("http")}
      onError={handleError}
      className={`${motionClassName} object-cover object-center`.trim()}
    />
  );
}
