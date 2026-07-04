import { resolveCatalogListingPhoto } from "@/lib/listing-photo-catalog";

/** Fore Beyond logo shown when a listing has no uploaded photo or video */
export const LISTING_IMAGE_FALLBACK = "/logo-fore-beyond.png";

const FALLBACK_INDEX_BY_CITY = new Map<string, number>();

function fallbackIndex(city?: string | null, country?: string | null): number {
  const key = `${city ?? ""}|${country ?? ""}`.toLowerCase();
  const current = FALLBACK_INDEX_BY_CITY.get(key) ?? 0;
  FALLBACK_INDEX_BY_CITY.set(key, current + 1);
  return current;
}

function isUsableImageUrl(url?: string | null): url is string {
  if (!url?.trim()) return false;
  const value = url.trim();
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

export function isUsableListingImageUrl(url?: string | null): url is string {
  return isUsableImageUrl(url);
}

export function getListingPlaceholderImage(country?: string | null, city?: string | null): string {
  return resolveCatalogListingPhoto(city, country, fallbackIndex(city, country));
}

export function resolveListingImage(
  coverPhotoUrl: string | null | undefined,
  _country?: string | null,
  _city?: string | null
): string {
  if (isUsableImageUrl(coverPhotoUrl)) return coverPhotoUrl.trim();
  return LISTING_IMAGE_FALLBACK;
}
