import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const catalog = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "data", "listing-photo-catalog.json"), "utf8")
);

function photo(id) {
  return `https://images.unsplash.com/${id}?w=1200&q=85&auto=format&fit=crop`;
}

function normalizeLocationKey(value) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function cityHash(value) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function resolveCoverPhotoId(city, country, fallbackIndex = 0) {
  const cityKey = normalizeLocationKey(city);
  const normalizedByCity = Object.fromEntries(
    Object.entries(catalog.byCity).map(([key, id]) => [normalizeLocationKey(key), id])
  );
  if (cityKey && normalizedByCity[cityKey]) {
    return normalizedByCity[cityKey];
  }

  const countryKey = normalizeLocationKey(country);
  const normalizedByCountry = Object.fromEntries(
    Object.entries(catalog.byCountry).map(([key, id]) => [normalizeLocationKey(key), id])
  );
  if (countryKey && normalizedByCountry[countryKey]) {
    return normalizedByCountry[countryKey];
  }

  return catalog.fallbackPool[fallbackIndex % catalog.fallbackPool.length];
}

export function resolveCatalogListingPhoto(city, country, fallbackIndex = 0) {
  return photo(resolveCoverPhotoId(city, country, fallbackIndex));
}

export function resolveCatalogListingGallery(city, country, listingTitle, fallbackIndex = 0) {
  const coverId = resolveCoverPhotoId(city, country, fallbackIndex);
  const interiors = catalog.homeInteriors ?? [];
  const interiorCount = catalog.interiorPhotoCount ?? 5;
  const seed = cityHash(`${city ?? ""}|${country ?? ""}|${fallbackIndex}`);
  const gallery = [
    {
      url: photo(coverId),
      caption: listingTitle ?? "Family home",
      isCover: true,
    },
  ];

  const used = new Set([coverId]);
  let offset = seed % Math.max(interiors.length, 1);
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
