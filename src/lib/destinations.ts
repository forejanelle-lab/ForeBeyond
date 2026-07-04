import { createClient } from "@/lib/supabase/server";
import { getListingPlaceholderImage } from "@/lib/listing-images";
import { getDestinationCountries } from "@/lib/seo/destination-catalog";

export interface PopularDestination {
  name: string;
  families: string;
  image: string;
  href: string;
  count: number;
}

const MIN_LISTINGS = 10;

/** Countries with more than {@link MIN_LISTINGS} published families. */
export async function getPopularDestinations(): Promise<PopularDestination[]> {
  try {
    const supabase = await createClient();
    const { data: listings, error } = await supabase
      .from("public_listings")
      .select("country");

    if (error) {
      console.error("getPopularDestinations:", error.message);
      return [];
    }

  const countryCounts = new Map<string, { display: string; count: number }>();
  (listings ?? []).forEach((row) => {
    const raw = row.country?.trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    const existing = countryCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      countryCounts.set(key, { display: raw, count: 1 });
    }
  });

  return [...countryCounts.values()]
    .filter(({ count }) => count > MIN_LISTINGS)
    .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display))
    .map(({ display, count }) => {
      const destination = getDestinationCountries().find(
        (c) => c.searchCountry.toLowerCase() === display.toLowerCase()
      );
      const href = destination
        ? `/destinations/${destination.slug}`
        : `/search?country=${encodeURIComponent(display)}`;
      return {
        name: display,
        families: `${count} families`,
        image: getListingPlaceholderImage(display),
        href,
        count,
      };
    });
  } catch (error) {
    console.error("getPopularDestinations:", error);
    return [];
  }
}
