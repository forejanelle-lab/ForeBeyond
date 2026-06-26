import { sampleImages } from "@/lib/sample-images";

const COUNTRY_IMAGES: Record<string, string> = {
  japan: sampleImages.japanStreet,
  italy: sampleImages.italyVillage,
  morocco: sampleImages.morocco,
};

const CITY_IMAGES: Record<string, string> = {
  kyoto: sampleImages.teaCeremony,
  tokyo: sampleImages.japanStreet,
  florence: sampleImages.italyVillage,
  rome: sampleImages.italyVillage,
  marrakech: sampleImages.morocco,
};

export function getListingPlaceholderImage(country?: string | null, city?: string | null): string {
  const cityKey = city?.trim().toLowerCase();
  if (cityKey && CITY_IMAGES[cityKey]) return CITY_IMAGES[cityKey];

  const countryKey = country?.trim().toLowerCase();
  if (countryKey && COUNTRY_IMAGES[countryKey]) return COUNTRY_IMAGES[countryKey];

  return sampleImages.familyKitchen;
}

function isUsableImageUrl(url?: string | null): url is string {
  if (!url?.trim()) return false;
  const value = url.trim();
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

export function resolveListingImage(
  coverPhotoUrl: string | null | undefined,
  country?: string | null,
  city?: string | null
): string {
  if (isUsableImageUrl(coverPhotoUrl)) return coverPhotoUrl.trim();
  return getListingPlaceholderImage(country, city);
}
