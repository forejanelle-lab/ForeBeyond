/** Map coordinates for listings without stored lat/lng. */

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  japan: { lat: 36.2, lng: 138.25 },
  "united states": { lat: 39.8, lng: -98.5 },
  usa: { lat: 39.8, lng: -98.5 },
  mexico: { lat: 23.6, lng: -102.5 },
  brazil: { lat: -14.2, lng: -51.9 },
  france: { lat: 46.2, lng: 2.2 },
  spain: { lat: 40.4, lng: -3.7 },
  italy: { lat: 42.5, lng: 12.5 },
  germany: { lat: 51.2, lng: 10.4 },
  "united kingdom": { lat: 55.4, lng: -3.4 },
  uk: { lat: 55.4, lng: -3.4 },
  nigeria: { lat: 9.08, lng: 8.67 },
  kenya: { lat: -0.02, lng: 37.9 },
  "south africa": { lat: -30.6, lng: 22.9 },
  india: { lat: 20.6, lng: 78.9 },
  china: { lat: 35.9, lng: 104.2 },
  australia: { lat: -25.3, lng: 133.8 },
  canada: { lat: 56.1, lng: -106.3 },
  portugal: { lat: 39.4, lng: -8.2 },
  morocco: { lat: 31.8, lng: -7.1 },
  thailand: { lat: 15.9, lng: 100.9 },
  vietnam: { lat: 14.1, lng: 108.3 },
  colombia: { lat: 4.6, lng: -74.1 },
  argentina: { lat: -38.4, lng: -63.6 },
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  kyoto: { lat: 35.0116, lng: 135.7681 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  osaka: { lat: 34.6937, lng: 135.5023 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  "new york": { lat: 40.7128, lng: -74.006 },
  lagos: { lat: 6.5244, lng: 3.3792 },
  nairobi: { lat: -1.2921, lng: 36.8219 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  rome: { lat: 41.9028, lng: 12.4964 },
  florence: { lat: 43.7696, lng: 11.2558 },
  milan: { lat: 45.4642, lng: 9.19 },
  naples: { lat: 40.8518, lng: 14.2681 },
  venice: { lat: 45.4408, lng: 12.3155 },
  turin: { lat: 45.0703, lng: 7.6869 },
  bologna: { lat: 44.4949, lng: 11.3426 },
  palermo: { lat: 38.1157, lng: 13.3615 },
  genoa: { lat: 44.4056, lng: 8.9463 },
  verona: { lat: 45.4384, lng: 10.9916 },
  siena: { lat: 43.3188, lng: 11.3308 },
  pisa: { lat: 43.7228, lng: 10.4017 },
  amalfi: { lat: 40.634, lng: 14.6027 },
  positano: { lat: 40.628, lng: 14.485 },
  cinque: { lat: 44.146, lng: 9.655 },
  matera: { lat: 40.6664, lng: 16.6043 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  "mexico city": { lat: 19.4326, lng: -99.1332 },
  "ciudad de mexico": { lat: 19.4326, lng: -99.1332 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
};

/** Alternate spellings → canonical city key in CITY_COORDS */
const CITY_ALIASES: Record<string, string> = {
  roma: "rome",
  firenze: "florence",
  milano: "milan",
  napoli: "naples",
  venezia: "venice",
  torino: "turin",
  genova: "genoa",
  "new york city": "new york",
  nyc: "new york",
  "mexico city": "mexico city",
  "ciudad de mexico": "mexico city",
  cdmx: "mexico city",
};

export function normalizeLocationPart(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(",")[0]
    .replace(/\s*\(.*\)\s*/g, "")
    .trim();
}

export function normalizeCountryKey(country: string | null | undefined): string {
  const key = normalizeLocationPart(country);
  if (key === "usa" || key === "u.s." || key === "u.s.a." || key === "united states of america") {
    return "united states";
  }
  if (key === "uk" || key === "u.k." || key === "great britain") {
    return "united kingdom";
  }
  return key;
}

export function resolveCityKey(city: string | null | undefined): string {
  const normalized = normalizeLocationPart(city);
  if (!normalized) return "";
  return CITY_ALIASES[normalized] ?? normalized;
}

export function lookupStaticCoords(
  city: string | null | undefined,
  country: string | null | undefined
): { lat: number; lng: number; precision: "city" | "country" } | null {
  const cityKey = resolveCityKey(city);
  const countryKey = normalizeCountryKey(country);

  if (cityKey && CITY_COORDS[cityKey]) {
    return { ...CITY_COORDS[cityKey], precision: "city" };
  }

  if (countryKey && COUNTRY_COORDS[countryKey]) {
    return { ...COUNTRY_COORDS[countryKey], precision: "country" };
  }

  return null;
}

function hashOffset(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return {
    lat: ((hash % 1000) / 1000 - 0.5) * 0.15,
    lng: (((hash >> 8) % 1000) / 1000 - 0.5) * 0.15,
  };
}

export interface ListingMapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  href: string;
}

export function buildListingMapPoint(
  listing: {
    id: string;
    city: string | null;
    country: string | null;
    title: string | null;
  },
  coords: { lat: number; lng: number },
  precision: "city" | "country"
): ListingMapPoint {
  const offset = precision === "country" ? hashOffset(listing.id) : { lat: 0, lng: 0 };
  const label =
    [listing.city, listing.country].filter(Boolean).join(", ") ||
    listing.title?.trim() ||
    "Host family";

  return {
    id: listing.id,
    lat: coords.lat + offset.lat,
    lng: coords.lng + offset.lng,
    label,
    href: `/families/${listing.id}`,
  };
}

export function getListingMapPoint(listing: {
  id: string;
  city: string | null;
  country: string | null;
  title: string | null;
  budget_per_night: number | null;
}): ListingMapPoint | null {
  const countryKey = normalizeCountryKey(listing.country);
  const cityKey = resolveCityKey(listing.city);
  if (!countryKey && !cityKey) return null;

  const coords = lookupStaticCoords(listing.city, listing.country);
  if (!coords) return null;

  return buildListingMapPoint(listing, coords, coords.precision);
}

export function getListingsMapBounds(points: Pick<ListingMapPoint, "lat" | "lng">[]) {
  if (points.length === 0) return null;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latPad = Math.max((maxLat - minLat) * 0.35, 0.25);
  const lngPad = Math.max((maxLng - minLng) * 0.35, 0.25);

  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
  };
}
