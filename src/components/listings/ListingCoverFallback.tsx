import Image from "next/image";
import { LISTING_IMAGE_FALLBACK } from "@/lib/listing-images";

interface ListingCoverFallbackProps {
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ListingCoverFallback({
  className = "",
  sizes = "(max-width: 768px) 100vw, 400px",
  priority,
}: ListingCoverFallbackProps) {
  return (
    <div className={`absolute inset-0 bg-black ${className}`} aria-hidden>
      <Image
        src={LISTING_IMAGE_FALLBACK}
        alt=""
        fill
        priority={priority}
        className="object-cover"
        sizes={sizes}
      />
    </div>
  );
}
