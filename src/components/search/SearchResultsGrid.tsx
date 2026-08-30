import { FamilySearchCard } from "@/components/search/FamilySearchCard";
import { SearchResultsAudioScope } from "@/components/listings/IntroVideoAudioContext";
import { Card } from "@/components/ui/Card";
import type { HostReviewStats } from "@/types/search-card";
import type { PublicListing } from "@/types/database";

interface SearchResultsGridProps {
  listings: PublicListing[];
  listingPhotoGalleries?: Record<string, string[]>;
  /** @deprecated Use listingPhotoGalleries */
  coverPhotos?: Record<string, string>;
  hostDisplayNames?: Record<string, string>;
  hostAvatarUrls?: Record<string, string>;
  hostReviewStatsById?: Record<string, HostReviewStats>;
  savedListingIds?: string[];
  showSaveButton?: boolean;
  layout?: "grid" | "list";
  resultLabel?: string;
}

export function SearchResultsGrid({
  listings,
  listingPhotoGalleries = {},
  coverPhotos = {},
  hostDisplayNames = {},
  hostAvatarUrls = {},
  hostReviewStatsById = {},
  savedListingIds = [],
  showSaveButton = true,
  layout = "list",
  resultLabel,
}: SearchResultsGridProps) {
  if (listings.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-16">
        <p className="text-xl font-serif font-semibold text-forest mb-2">No families match your search</p>
        <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
          Try adjusting your filters or searching a different destination to discover host families.
        </p>
      </Card>
    );
  }

  return (
    <SearchResultsAudioScope>
      <div className="space-y-5">
        {resultLabel && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
            <p className="text-sm font-medium text-charcoal">{resultLabel}</p>
            <p className="text-sm text-muted">Sort: Recommended</p>
          </div>
        )}
        <div
          className={
            layout === "list"
              ? "space-y-4 md:space-y-5"
              : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6"
          }
        >
          {listings.map((listing) => {
            const photos = listingPhotoGalleries[listing.id] ?? [];
            const legacyCover = coverPhotos[listing.id] ?? null;

            return (
              <FamilySearchCard
                key={listing.id}
                listing={listing}
                listingPhotos={photos}
                coverPhotoUrl={photos[0] ?? legacyCover}
                hostDisplayName={hostDisplayNames[listing.host_id] ?? listing.host_first_name}
                hostAvatarUrl={hostAvatarUrls[listing.host_id] ?? null}
                hostReviewStats={hostReviewStatsById[listing.host_id] ?? null}
                isSaved={savedListingIds.includes(listing.id)}
                showSaveButton={showSaveButton}
                layout={layout}
              />
            );
          })}
        </div>
      </div>
    </SearchResultsAudioScope>
  );
}
