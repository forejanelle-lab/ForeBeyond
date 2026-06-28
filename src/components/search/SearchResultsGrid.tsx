import { FamilySearchCard } from "@/components/search/FamilySearchCard";
import { Card } from "@/components/ui/Card";
import type { PublicListing } from "@/types/database";

interface SearchResultsGridProps {
  listings: PublicListing[];
  coverPhotos: Record<string, string>;
  hostDisplayNames?: Record<string, string>;
  savedListingIds?: string[];
  showSaveButton?: boolean;
  layout?: "grid" | "list";
}

export function SearchResultsGrid({
  listings,
  coverPhotos,
  hostDisplayNames = {},
  savedListingIds = [],
  showSaveButton = true,
  layout = "list",
}: SearchResultsGridProps) {
  if (listings.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-16">
        <p className="text-lg font-medium text-forest mb-2">No families match your search</p>
        <p className="text-sm text-charcoal-light max-w-md mx-auto">
          Try adjusting your filters or searching a different destination to discover host families.
        </p>
      </Card>
    );
  }

  return (
    <div className={layout === "list" ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6"}>
      {listings.map((listing) => (
        <FamilySearchCard
          key={listing.id}
          listing={listing}
          coverPhotoUrl={coverPhotos[listing.id] ?? null}
          hostDisplayName={hostDisplayNames[listing.host_id] ?? listing.host_first_name}
          isSaved={savedListingIds.includes(listing.id)}
          showSaveButton={showSaveButton}
          layout={layout}
        />
      ))}
    </div>
  );
}
