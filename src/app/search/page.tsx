import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import { SearchAnalyticsTracker } from "@/components/analytics/SearchAnalyticsTracker";
import { Container } from "@/components/ui/Container";
import {
  filterListingsClientSide,
  getUniqueCountries,
  parseSearchParams,
} from "@/lib/search";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import type { ListingPhoto, PublicListing } from "@/types/database";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Search Families",
  description: "Find verified host families and book authentic cultural stays around the world.",
  path: "/search",
});

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
  const hostIds = [...new Set(filtered.map((listing) => listing.host_id))];
  const [{ data: hostProfiles }, coverPhotos] = await Promise.all([
    hostIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", hostIds)
      : Promise.resolve({ data: [] }),
    getCoverPhotos(filtered.map((listing) => listing.id)),
  ]);

  const hostDisplayNameById = Object.fromEntries(
    ((hostProfiles as { id: string; full_name: string | null }[]) ?? []).map((profile) => [
      profile.id,
      formatMemberDisplayName(profile.full_name, {
        fallback: filtered.find((l) => l.host_id === profile.id)?.host_first_name ?? "Host",
      }),
    ])
  );

  let savedListingIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id);
    savedListingIds = saved?.map((row) => row.listing_id) ?? [];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">
      <SearchFiltersPanel countries={countries} resultCount={filtered.length} />
      <div className="min-w-0 space-y-6">
        <SearchResultsGrid
          listings={filtered}
          coverPhotos={coverPhotos}
          hostDisplayNames={hostDisplayNameById}
          savedListingIds={savedListingIds}
          layout="list"
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
    <>
      <PageHero
        image={sampleImages.searchFamilies}
        imageAlt="Friends and travelers sharing time together outdoors"
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
