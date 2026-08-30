import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HeroSearchBar } from "@/components/design/HeroSearchBar";
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
import {
  getHostAvatarUrlsByHostId,
  getHostReviewStatsByHostId,
  getListingPhotoGalleries,
} from "@/lib/search-card-data";
import type { PublicListing } from "@/types/database";
import { createPageMetadata } from "@/lib/site-metadata";
import { getDestinationCountries } from "@/lib/seo/destination-catalog";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const country = filters.country.trim();
  const city = filters.city.trim();

  if (city && country) {
    const title = `Homestays in ${city}, ${country}`;
    return createPageMetadata({
      title,
      description: `Find verified local host families in ${city}, ${country}. Cultural immersion travel and authentic homestay experiences with Fore Beyond.`,
      path: `/search?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`,
    });
  }

  if (country) {
    const destination = getDestinationCountries().find(
      (d) => d.searchCountry.toLowerCase() === country.toLowerCase()
    );
    const title = destination
      ? `${destination.pageTitle.split(" — ")[0] ?? destination.name + " Homestays"}`
      : `Homestays in ${country}`;
    return createPageMetadata({
      title,
      description: `Browse verified host families in ${country} for cultural immersion travel and authentic homestay experiences. Travel like a local with Fore Beyond.`,
      path: `/search?country=${encodeURIComponent(country)}`,
    });
  }

  return createPageMetadata({
    title: "Search Verified Host Families",
    description:
      "Find verified local hosts for cultural immersion travel and homestay experiences worldwide. Authentic travel beyond hotels.",
    path: "/search",
  });
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { t } = await getServerTranslations();
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
  const listingIds = filtered.map((listing) => listing.id);
  const listingAvatarByHostId = Object.fromEntries(
    filtered.map((listing) => [listing.host_id, listing.host_avatar_url ?? null])
  );
  const [{ data: hostProfiles }, listingPhotoGalleries, hostReviewStatsById, hostAvatarUrls] =
    await Promise.all([
    hostIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", hostIds)
      : Promise.resolve({ data: [] }),
    getListingPhotoGalleries(listingIds),
    getHostReviewStatsByHostId(hostIds),
    getHostAvatarUrlsByHostId(hostIds, listingAvatarByHostId),
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

  const resultLabel = t("search.hostsFound", { count: String(filtered.length) });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">
      <SearchFiltersPanel countries={countries} resultCount={filtered.length} />
      <div className="min-w-0 space-y-6">
        <SearchResultsGrid
          listings={filtered}
          listingPhotoGalleries={listingPhotoGalleries}
          hostDisplayNames={hostDisplayNameById}
          hostAvatarUrls={hostAvatarUrls}
          hostReviewStatsById={hostReviewStatsById}
          savedListingIds={savedListingIds}
          layout="list"
          resultLabel={resultLabel}
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
  const filters = parseSearchParams(params);
  const { t } = await getServerTranslations();

  return (
    <>
      <section className="bg-cream border-b border-sage-dark/15">
        <Container className="py-10 md:py-14 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-gold uppercase tracking-[0.15em] mb-3">
              {t("search.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif font-semibold text-forest leading-[1.15] text-balance">
              {filters.city || filters.country
                ? t("search.titleInLocation", {
                    location: [filters.city, filters.country].filter(Boolean).join(", "),
                  })
                : t("search.title")}
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted leading-relaxed max-w-2xl">
              {filters.city || filters.country
                ? t("search.subtitleInLocation", {
                    location: [filters.city, filters.country].filter(Boolean).join(", "),
                  })
                : t("search.subtitle")}
            </p>
          </div>

          <div className="mt-8 md:mt-10">
            <HeroSearchBar variant="page" />
          </div>
        </Container>
      </section>

      <Container className="py-8 md:py-12">
        <Suspense fallback={null}>
          <SearchAnalyticsTracker />
        </Suspense>

        <Suspense
          fallback={
            <p className="text-sm text-muted">{t("common.loadingFamilies")}</p>
          }
        >
          <SearchResults searchParams={params} />
        </Suspense>
      </Container>
    </>
  );
}
