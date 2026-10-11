import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import type { HostReviewStats } from "@/types/search-card";
import type { PublicListing } from "@/types/database";

interface SearchResultsViewProps {
  listings: PublicListing[];
  listingPhotoGalleries?: Record<string, string[]>;
  hostDisplayNames?: Record<string, string>;
  hostAvatarUrls?: Record<string, string>;
  hostReviewStatsById?: Record<string, HostReviewStats>;
  savedListingIds?: string[];
  resultLabel?: string;
}

export function SearchResultsView({
  listings,
  listingPhotoGalleries,
  hostDisplayNames,
  hostAvatarUrls,
  hostReviewStatsById,
  savedListingIds,
  resultLabel,
}: SearchResultsViewProps) {
  return (
    <div className="min-w-0 space-y-5">
      {resultLabel ? <p className="text-sm font-medium text-charcoal">{resultLabel}</p> : null}
      <SearchResultsGrid
        listings={listings}
        listingPhotoGalleries={listingPhotoGalleries}
        hostDisplayNames={hostDisplayNames}
        hostAvatarUrls={hostAvatarUrls}
        hostReviewStatsById={hostReviewStatsById}
        savedListingIds={savedListingIds}
        layout="list"
      />
    </div>
  );
}
