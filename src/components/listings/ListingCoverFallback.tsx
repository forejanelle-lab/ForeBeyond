import { ListingLogoFallbackImage } from "@/components/listings/ListingLogoFallbackImage";

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
    <div
      className={`absolute inset-0 overflow-hidden bg-gray-200 ${className}`}
      aria-hidden
    >
      <ListingLogoFallbackImage priority={priority} sizes={sizes} />
    </div>
  );
}
