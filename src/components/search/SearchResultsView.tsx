"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { List, Map } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { SearchFamilyMap } from "@/components/search/SearchFamilyMap";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import type { ListingMapPoint } from "@/lib/listing-map-coords";
import type { HostReviewStats } from "@/types/search-card";
import type { PublicListing } from "@/types/database";

interface SearchResultsViewProps {
  listings: PublicListing[];
  mapPoints: ListingMapPoint[];
  listingPhotoGalleries?: Record<string, string[]>;
  hostDisplayNames?: Record<string, string>;
  hostAvatarUrls?: Record<string, string>;
  hostReviewStatsById?: Record<string, HostReviewStats>;
  savedListingIds?: string[];
  resultLabel?: string;
}

export function SearchResultsView({
  listings,
  mapPoints,
  listingPhotoGalleries,
  hostDisplayNames,
  hostAvatarUrls,
  hostReviewStatsById,
  savedListingIds,
  resultLabel,
}: SearchResultsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const view = searchParams.get("view") === "map" ? "map" : "list";

  function setView(next: "list" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "map") params.set("view", "map");
    else params.delete("view");
    const query = params.toString();
    router.replace(query ? `/search?${query}` : "/search", { scroll: false });
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        {resultLabel ? (
          <p className="text-sm font-medium text-charcoal">{resultLabel}</p>
        ) : (
          <span />
        )}
        <div className="inline-flex rounded-full border border-sage-dark/30 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "list" ? "bg-forest text-white" : "text-charcoal-light hover:text-forest"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            {t("search.viewList")}
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "map" ? "bg-forest text-white" : "text-charcoal-light hover:text-forest"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            {t("search.viewMap")}
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="h-[min(72vh,740px)] min-h-[420px]">
          <SearchFamilyMap mapPoints={mapPoints} />
        </div>
      ) : (
        <SearchResultsGrid
          listings={listings}
          listingPhotoGalleries={listingPhotoGalleries}
          hostDisplayNames={hostDisplayNames}
          hostAvatarUrls={hostAvatarUrls}
          hostReviewStatsById={hostReviewStatsById}
          savedListingIds={savedListingIds}
          layout="list"
        />
      )}
    </div>
  );
}
