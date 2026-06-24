import { Suspense } from "react";
import Link from "next/link";
import { Compass, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import { SearchAnalyticsTracker } from "@/components/analytics/SearchAnalyticsTracker";
import { Badge } from "@/components/ui/Badge";
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
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
      <SearchFiltersPanel countries={countries} resultCount={filtered.length} />
      <div>
        <SearchResultsGrid
          listings={filtered}
          coverPhotos={coverPhotos}
          savedListingIds={savedListingIds}
        />
      </div>
    </div>
  );
}

export default async function SearchFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <Container className="py-10 md:py-16 lg:py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Compass className="h-3 w-3" />
            Search Families
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-forest">
            Find your host family
          </h1>
          <p className="mt-2 text-charcoal-light max-w-2xl">
            Discover verified families offering authentic cultural immersion around the world.
          </p>
        </div>
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
  );
}
