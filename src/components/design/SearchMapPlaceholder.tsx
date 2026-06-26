import { MapPin } from "lucide-react";

interface SearchMapPlaceholderProps {
  listings?: { id: string; city: string | null; country: string | null; budget_per_night: number | null }[];
}

export function SearchMapPlaceholder({ listings = [] }: SearchMapPlaceholderProps) {
  return (
    <div className="sticky top-24 h-[calc(100vh-8rem)] min-h-[320px] rounded-2xl overflow-hidden bg-sage/60 border border-sage-dark/30 shadow-md hidden md:block">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-sage)_0%,#c8dcc9_50%,var(--color-sage-dark)_100%)] opacity-80" />
      <div className="absolute inset-0 p-6">
        <p className="text-sm font-medium text-forest/70 mb-4">Map view</p>
        <div className="relative h-full">
          {listings.slice(0, 6).map((listing, i) => (
            <div
              key={listing.id}
              className="absolute flex items-center gap-1 rounded-full bg-forest text-white text-xs font-semibold px-3 py-1.5 shadow-lg"
              style={{
                top: `${15 + (i % 3) * 28}%`,
                left: `${10 + (i % 2) * 40 + i * 5}%`,
              }}
            >
              <MapPin className="h-3 w-3" />
              {listing.budget_per_night != null ? `$${listing.budget_per_night}` : "—"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
