interface ListingCoverFallbackProps {
  className?: string;
}

export function ListingCoverFallback({ className = "" }: ListingCoverFallbackProps) {
  return (
    <div
      className={`absolute inset-0 bg-sage ${className}`.trim()}
      aria-hidden
    />
  );
}
