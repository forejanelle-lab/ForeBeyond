import {
  buildListingMapPoint,
  getListingMapPoint,
  lookupStaticCoords,
  normalizeCountryKey,
  resolveCityKey,
  type ListingMapPoint,
} from "@/lib/listing-map-coords";

const geocodeCache = new Map<string, { lat: number; lng: number }>();

function locationCacheKey(city: string, country: string) {
  return `${city}|${country}`;
}

async function fetchCityCoordinates(
  city: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const key = locationCacheKey(city, country);
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const query = city && country ? `${city}, ${country}` : country || city;
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent": "ForeBeyond/1.0 (family search map)",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as { lat: string; lon: string }[];
    const hit = results?.[0];
    if (!hit) return null;

    const coords = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
    if (Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) return null;

    geocodeCache.set(key, coords);
    return coords;
  } catch {
    return null;
  }
}

async function resolveCoordsForLocation(city: string, country: string) {
  const staticCoords = lookupStaticCoords(city, country);
  if (staticCoords?.precision === "city") {
    return { coords: staticCoords, precision: "city" as const };
  }

  const cityKey = resolveCityKey(city);
  const countryKey = normalizeCountryKey(country);
  if (cityKey) {
    const geocoded = await fetchCityCoordinates(cityKey, countryKey);
    if (geocoded) {
      return { coords: geocoded, precision: "city" as const };
    }
  }

  if (staticCoords) {
    return { coords: staticCoords, precision: "country" as const };
  }

  if (countryKey) {
    const geocoded = await fetchCityCoordinates("", countryKey);
    if (geocoded) {
      return { coords: geocoded, precision: "country" as const };
    }
  }

  return null;
}

export async function resolveListingMapPoints(
  listings: {
    id: string;
    city: string | null;
    country: string | null;
    title: string | null;
    budget_per_night: number | null;
  }[]
): Promise<ListingMapPoint[]> {
  const uniqueLocations = new Map<string, { city: string; country: string }>();

  for (const listing of listings) {
    const city = resolveCityKey(listing.city);
    const country = normalizeCountryKey(listing.country);
    if (!city && !country) continue;

    const key = locationCacheKey(city, country);
    if (!uniqueLocations.has(key)) {
      uniqueLocations.set(key, { city, country });
    }
  }

  const resolvedByKey = new Map<
    string,
    { coords: { lat: number; lng: number }; precision: "city" | "country" }
  >();

  for (const [key, location] of uniqueLocations) {
    const staticCity = lookupStaticCoords(location.city, location.country);
    if (staticCity?.precision === "city") {
      resolvedByKey.set(key, { coords: staticCity, precision: "city" });
      continue;
    }

    if (geocodeCache.has(key)) {
      resolvedByKey.set(key, {
        coords: geocodeCache.get(key)!,
        precision: "city",
      });
    }
  }

  for (const [key, location] of uniqueLocations) {
    if (resolvedByKey.has(key)) continue;
    const resolved = await resolveCoordsForLocation(location.city, location.country);
    if (resolved) {
      resolvedByKey.set(key, resolved);
    }
  }

  const points: ListingMapPoint[] = [];

  for (const listing of listings) {
    const staticPoint = getListingMapPoint(listing);
    if (staticPoint && lookupStaticCoords(listing.city, listing.country)?.precision === "city") {
      points.push(staticPoint);
      continue;
    }

    const city = resolveCityKey(listing.city);
    const country = normalizeCountryKey(listing.country);
    const key = locationCacheKey(city, country);
    const resolved = resolvedByKey.get(key);

    if (resolved) {
      points.push(buildListingMapPoint(listing, resolved.coords, resolved.precision));
      continue;
    }

    if (staticPoint) {
      points.push(staticPoint);
    }
  }

  return points;
}
