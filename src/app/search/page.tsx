import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { SearchMapPlaceholder } from "@/components/design/SearchMapPlaceholder";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import { SearchAnalyticsTracker } from "@/components/analytics/SearchAnalyticsTracker";
import { Container } from "@/components/ui/Container";
import {
  filterListingsClientSide,
  getUniqueCountries,
  parseSearchParams,
} from "@/lib/search";
import type { ListingPhoto, PublicListing } from "@/types/database";

export const metadata = { title: "Search Families" };

async function getCoverPhotos(listingIds: string[]) {
  if (listingIds.length === 0) return {};

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("listing_photos")
    .select("listing_id, file_url, is_cover, sort_order")
    .in("listing_id", listingIds)
    .order("sort_order");

  const coverMap: Record<string, string> = {};
  (photos as Pick<ListingPhoto, "listing_id" | "file_url" | "is_cover">[] | null)?.forEach(
    (photo) => {
      if (photo.is_cover || !coverMap[photo.listing_id]) {
        coverMap[photo.listing_id] = photo.file_url;
      }
    }
  );

  return coverMap;
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const filters = parseSearchParams(searchParams);

  const [{ data: listings }, { data: { user } }] = await Promise.all([
    supabase.from("public_listings").select("*").order("trust_score", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const allListings = (listings as PublicListing[]) ?? [];
  const filtered = filterListingsClientSide(allListings, filters);
  const countries = getUniqueCountries(allListings);
  const coverPhotos = await getCoverPhotos(filtered.map((listing) => listing.id));

  let savedListingIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id);
    savedListingIds = saved?.map((row) => row.listing_id) ?? [];
  }

  return (
    <>
      <SearchFiltersPanel countries={countries} resultCount={filtered.length} />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(240px,320px)] gap-6 md:gap-8">
        <div className="space-y-6 min-w-0">
          <SearchResultsGrid
            listings={filtered}
            coverPhotos={coverPhotos}
            savedListingIds={savedListingIds}
            layout="list"
          />
        </div>
        <SearchMapPlaceholder listings={filtered} />
      </div>
    </>
  );
}

export default async function SearchFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHero
        image={sampleImages.japanStreet}
        imageAlt="Families offering cultural stays"
        eyebrow="Search Families"
        title="Find your host family"
        subtitle="Discover verified families offering authentic cultural immersion around the world."
        height="md"
      />

      <Container className="py-10 md:py-14">
        <div className="flex items-center justify-between gap-4 mb-8">
          <p className="text-sm text-charcoal-light hidden md:block">
            Filter by budget, language, meals, and verification status
          </p>
          <Link
            href="/saved"
            className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline"
          >
            <Heart className="h-4 w-4" />
            Saved families
          </Link>
        </div>

        <Suspense fallback={null}>
          <SearchAnalyticsTracker />
        </Suspense>

        <Suspense fallback={<p className="text-sm text-charcoal-light">Loading families...</p>}>
          <SearchResults searchParams={params} />
        </Suspense>
      </Container>
    </>
  );
}
