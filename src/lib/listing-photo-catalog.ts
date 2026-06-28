import catalog from "@/data/listing-photo-catalog.json";

function photo(id: string) {
  return `https://images.unsplash.com/${id}?w=1200&q=85&auto=format&fit=crop`;
}

function normalizeLocationKey(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export const LISTING_PHOTO_BY_CITY: Record<string, string> = Object.fromEntries(
  Object.entries(catalog.byCity).map(([city, id]) => [normalizeLocationKey(city), photo(id)])
);

const COUNTRY_FALLBACKS: Record<string, string> = Object.fromEntries(
  Object.entries(catalog.byCountry).map(([country, id]) => [normalizeLocationKey(country), photo(id)])
);

const UNIQUE_FALLBACK_POOL = catalog.fallbackPool.map(photo);

export function resolveCatalogListingPhoto(
  city?: string | null,
  country?: string | null,
  fallbackIndex = 0
): string {
  const cityKey = normalizeLocationKey(city);
  if (cityKey && LISTING_PHOTO_BY_CITY[cityKey]) {
    return LISTING_PHOTO_BY_CITY[cityKey];
  }

  const countryKey = normalizeLocationKey(country);
  if (countryKey && COUNTRY_FALLBACKS[countryKey]) {
    return COUNTRY_FALLBACKS[countryKey];
  }

  return UNIQUE_FALLBACK_POOL[fallbackIndex % UNIQUE_FALLBACK_POOL.length];
}
