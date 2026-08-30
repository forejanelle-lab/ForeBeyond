import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatAverageRating } from "@/lib/reviews";
import { isListingLogoFallbackUrl, isUsableListingImageUrl } from "@/lib/listing-images";
import type { HostReviewStats } from "@/types/search-card";
import type { ListingPhoto } from "@/types/database";

export type { HostReviewStats };

type ListingPhotoRow = Pick<ListingPhoto, "listing_id" | "file_url" | "is_cover" | "sort_order">;

function sortListingPhotos(photos: ListingPhotoRow[]): ListingPhotoRow[] {
  return [...photos].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

function usablePhotoUrls(photos: ListingPhotoRow[]): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const photo of sortListingPhotos(photos)) {
    const url = photo.file_url?.trim();
    if (!url || !isUsableListingImageUrl(url) || isListingLogoFallbackUrl(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= 3) break;
  }

  return urls;
}

/** Up to three listing photo URLs per listing (cover first, then sort order). */
export async function getListingPhotoGalleries(
  listingIds: string[]
): Promise<Record<string, string[]>> {
  if (listingIds.length === 0) return {};

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("listing_photos")
    .select("listing_id, file_url, is_cover, sort_order")
    .in("listing_id", listingIds)
    .order("sort_order");

  const byListing = new Map<string, ListingPhotoRow[]>();
  for (const photo of (photos as ListingPhotoRow[] | null) ?? []) {
    const rows = byListing.get(photo.listing_id) ?? [];
    rows.push(photo);
    byListing.set(photo.listing_id, rows);
  }

  return Object.fromEntries(
    listingIds.map((id) => [id, usablePhotoUrls(byListing.get(id) ?? [])])
  );
}

/** Traveler review averages for host cards (one query for all visible hosts). */
export async function getHostReviewStatsByHostId(
  hostIds: string[]
): Promise<Record<string, HostReviewStats>> {
  if (hostIds.length === 0) return {};

  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("public_reviews")
    .select("reviewee_id, rating")
    .in("reviewee_id", hostIds)
    .eq("reviewer_role", "traveler");

  const grouped = new Map<string, { rating: number }[]>();
  for (const review of (reviews as { reviewee_id: string; rating: number }[] | null) ?? []) {
    const rows = grouped.get(review.reviewee_id) ?? [];
    rows.push({ rating: review.rating });
    grouped.set(review.reviewee_id, rows);
  }

  return Object.fromEntries(
    hostIds.map((hostId) => {
      const hostReviews = grouped.get(hostId) ?? [];
      return [
        hostId,
        {
          avgRating: formatAverageRating(hostReviews),
          reviewCount: hostReviews.length,
        },
      ];
    })
  );
}

/**
 * Host profile avatars for search cards. Uses `host_avatar_url` from listings when
 * present (migration 076+), otherwise loads public avatar URLs server-side.
 */
export async function getHostAvatarUrlsByHostId(
  hostIds: string[],
  listingAvatarByHostId: Record<string, string | null | undefined> = {}
): Promise<Record<string, string>> {
  if (hostIds.length === 0) return {};

  const result: Record<string, string> = {};
  const missingHostIds: string[] = [];

  for (const hostId of hostIds) {
    const fromListing = listingAvatarByHostId[hostId]?.trim();
    if (fromListing) {
      result[hostId] = fromListing;
    } else {
      missingHostIds.push(hostId);
    }
  }

  if (missingHostIds.length === 0) return result;

  try {
    const service = createServiceClient();
    const { data: profiles } = await service
      .from("profiles")
      .select("id, avatar_url")
      .in("id", missingHostIds);

    for (const profile of (profiles as { id: string; avatar_url: string | null }[] | null) ?? []) {
      const url = profile.avatar_url?.trim();
      if (url) result[profile.id] = url;
    }
  } catch (error) {
    console.error("getHostAvatarUrlsByHostId:", error);
  }

  return result;
}
