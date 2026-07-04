import Image from "next/image";
import { LISTING_IMAGE_FALLBACK } from "@/lib/listing-images";

interface ListingCoverFallbackProps {
  className?: string;
}

export function ListingCoverFallback({ className = "" }: ListingCoverFallbackProps) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-sage ${className}`}
      aria-hidden
    >
      <Image
        src={LISTING_IMAGE_FALLBACK}
        alt=""
        width={180}
        height={120}
        className="w-[42%] max-w-[180px] h-auto object-contain opacity-90"
      />
    </div>
  );
}
