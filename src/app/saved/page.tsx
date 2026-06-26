import { redirect } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { ListingPhoto, PublicListing } from "@/types/database";

export const metadata = { title: "Saved Families" };

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

export default async function SavedFamiliesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/saved");

  const { data: savedRows } = await supabase
    .from("saved_listings")
    .select("listing_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listingIds = savedRows?.map((row) => row.listing_id) ?? [];

  let listings: PublicListing[] = [];
  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("public_listings")
      .select("*")
      .in("id", listingIds);
    listings = (data as PublicListing[]) ?? [];
    listings.sort(
      (a, b) => listingIds.indexOf(a.id) - listingIds.indexOf(b.id)
    );
  }

  const coverPhotos = await getCoverPhotos(listingIds);

  return (
    <Container className="py-10 md:py-16 lg:py-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Heart className="h-3 w-3" />
            Saved Families
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-forest">Your favorites</h1>
          <p className="mt-2 text-charcoal-light">
            {listings.length} saved {listings.length === 1 ? "family" : "families"}
          </p>
        </div>
        <ButtonLink href="/search" variant="secondary" size="md">
          <Search className="h-4 w-4" />
          Search more families
        </ButtonLink>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <Heart className="h-10 w-10 text-forest mx-auto mb-4" />
          <p className="text-charcoal-light mb-4">You haven&apos;t saved any families yet.</p>
          <ButtonLink href="/search" variant="primary" size="lg">
            <Search className="h-4 w-4" />
            Explore families
          </ButtonLink>
        </div>
      ) : (
        <SearchResultsGrid
          listings={listings}
          coverPhotos={coverPhotos}
          savedListingIds={listingIds}
        />
      )}
    </Container>
  );
}
