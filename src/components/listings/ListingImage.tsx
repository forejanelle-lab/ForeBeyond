"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isUsableListingImageUrl } from "@/lib/listing-images";

type ListingImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  country?: string | null;
  city?: string | null;
};

export function ListingImage({
  src,
  alt,
  country: _country,
  city: _city,
  unoptimized,
  onError,
  className = "",
  fill,
  ...props
}: ListingImageProps) {
  const [failed, setFailed] = useState(false);
  const usable = isUsableListingImageUrl(src) && !failed;

  if (!usable) {
    return (
      <div
        aria-hidden
        className={`bg-sage ${fill ? "absolute inset-0" : ""} ${className}`.trim()}
      />
    );
  }

  const imageSrc = src!.trim();

  return (
    <Image
      {...props}
      fill={fill}
      src={imageSrc}
      alt={alt}
      unoptimized={unoptimized ?? imageSrc.startsWith("http")}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      className={className}
    />
  );
}
