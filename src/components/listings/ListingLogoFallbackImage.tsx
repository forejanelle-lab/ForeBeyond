import Image from "next/image";
import { LISTING_IMAGE_FALLBACK } from "@/lib/listing-images";

interface ListingLogoFallbackImageProps {
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function ListingLogoFallbackImage({
  priority,
  sizes,
  className = "",
}: ListingLogoFallbackImageProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-200">
      <Image
        src={LISTING_IMAGE_FALLBACK}
        alt=""
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className={`object-cover object-center ${className}`.trim()}
      />
    </div>
  );
}
