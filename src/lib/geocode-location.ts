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
  return `${resolveCityKey(city)}|${normalizeCountryKey(country)}`;
}

async function fetchCityCoordinates(
  city: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const key = locationCacheKey(city, country);
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const query = [city, country].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "0",
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent": "ForeBeyond/1.0 (https://forebeyond.com; family search map)",
        Accept: "application/json",
        "Accept-Language": "en",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
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

  const originalCity = city.trim();
  const originalCountry = country.trim();
  if (originalCity) {
    const geocoded = await fetchCityCoordinates(originalCity, originalCountry);
    if (geocoded) {
      return { coords: geocoded, precision: "city" as const };
    }
  }

  if (staticCoords) {
    return { coords: staticCoords, precision: "country" as const };
  }

  if (originalCountry) {
    const geocoded = await fetchCityCoordinates("", originalCountry);
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
    host_first_name?: string | null;
    trust_score?: number;
    verification_status?: string | null;
  }[],
  hostNamesByListingId?: Record<string, string | null | undefined>
): Promise<ListingMapPoint[]> {
  const uniqueLocations = new Map<string, { city: string; country: string }>();

  for (const listing of listings) {
    const city = listing.city?.trim() ?? "";
    const country = listing.country?.trim() ?? "";
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
    const extras = {
      hostName: hostNamesByListingId?.[listing.id] ?? listing.host_first_name ?? null,
      trustScore: listing.trust_score ?? 0,
      verified: listing.verification_status === "verified",
    };
    const city = listing.city?.trim() ?? "";
    const country = listing.country?.trim() ?? "";
    const key = locationCacheKey(city, country);
    const resolved = resolvedByKey.get(key);

    if (resolved) {
      points.push(buildListingMapPoint(listing, resolved.coords, resolved.precision, extras));
      continue;
    }

    const staticPoint = getListingMapPoint(listing);
    if (staticPoint) {
      points.push({ ...staticPoint, ...extras, hostName: extras.hostName ?? staticPoint.hostName });
    }
  }

  return points;
}
