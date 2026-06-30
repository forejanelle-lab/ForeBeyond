import catalog from "@/data/listing-photo-catalog.json";

export type ListingCatalogPhoto = {
  url: string;
  caption: string;
  isCover: boolean;
};

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

function cityHash(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function resolveCoverPhotoId(
  city?: string | null,
  country?: string | null,
  fallbackIndex = 0
): string {
  const cityKey = normalizeLocationKey(city);
  const normalizedByCity = Object.fromEntries(
    Object.entries(catalog.byCity).map(([key, id]) => [normalizeLocationKey(key), id])
  );
  if (cityKey && normalizedByCity[cityKey]) {
    return normalizedByCity[cityKey];
  }

  const countryKey = normalizeLocationKey(country);
  const normalizedByCountry = Object.fromEntries(
    Object.entries(catalog.byCountry).map(([countryName, id]) => [
      normalizeLocationKey(countryName),
      id,
    ])
  );
  if (countryKey && normalizedByCountry[countryKey]) {
    return normalizedByCountry[countryKey];
  }

  return catalog.fallbackPool[fallbackIndex % catalog.fallbackPool.length];
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
  return photo(resolveCoverPhotoId(city, country, fallbackIndex));
}

export function resolveCatalogListingGallery(
  city?: string | null,
  country?: string | null,
  listingTitle?: string | null,
  fallbackIndex = 0
): ListingCatalogPhoto[] {
  const coverId = resolveCoverPhotoId(city, country, fallbackIndex);
  const interiors = catalog.homeInteriors ?? [];
  const interiorCount = catalog.interiorPhotoCount ?? 5;
  const seed = cityHash(`${city ?? ""}|${country ?? ""}|${fallbackIndex}`);
  const gallery: ListingCatalogPhoto[] = [
    {
      url: photo(coverId),
      caption: listingTitle?.trim() || "Family home",
      isCover: true,
    },
  ];

  const used = new Set<string>([coverId]);
  const offset = seed % Math.max(interiors.length, 1);
  let scan = 0;

  while (gallery.length < interiorCount + 1 && scan < interiors.length * 2) {
    const entry = interiors[(offset + scan) % interiors.length];
    scan += 1;
    if (used.has(entry.id)) continue;
    used.add(entry.id);
    gallery.push({
      url: photo(entry.id),
      caption: entry.caption,
      isCover: false,
    });
  }

  return gallery;
}
