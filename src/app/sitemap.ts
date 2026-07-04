import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site-metadata";
import { getDestinationCountries } from "@/lib/seo/destination-catalog";
import { GUIDE_ARTICLES } from "@/lib/seo/guides-catalog";
import { TRAVELER_STORIES } from "@/lib/seo/stories-catalog";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/search"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/experiences"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/destinations"), changeFrequency: "weekly", priority: 0.85 },
  { url: absoluteUrl("/guides"), changeFrequency: "weekly", priority: 0.75 },
  { url: absoluteUrl("/stories"), changeFrequency: "weekly", priority: 0.7 },
  { url: absoluteUrl("/trust-center"), changeFrequency: "monthly", priority: 0.7 },
  { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
  { url: absoluteUrl("/guidelines"), changeFrequency: "yearly", priority: 0.3 },
  { url: absoluteUrl("/cancellation-policy"), changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: listings }, { data: experiences }] = await Promise.all([
    supabase.from("public_listings").select("id, published_at, created_at"),
    supabase.from("public_experiences").select("id, published_at, created_at"),
  ]);

  const destinationRoutes: MetadataRoute.Sitemap = getDestinationCountries().flatMap((country) => [
    {
      url: absoluteUrl(`/destinations/${country.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    ...country.cities.map((city) => ({
      url: absoluteUrl(`/destinations/${country.slug}/${city.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]);

  const guideRoutes: MetadataRoute.Sitemap = GUIDE_ARTICLES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: guide.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const storyRoutes: MetadataRoute.Sitemap = TRAVELER_STORIES.map((story) => ({
    url: absoluteUrl(`/stories/${story.slug}`),
    lastModified: story.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const listingEntries: MetadataRoute.Sitemap =
    listings?.map((listing) => ({
      url: absoluteUrl(`/families/${listing.id}`),
      lastModified: listing.published_at ?? listing.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) ?? [];

  const experienceEntries: MetadataRoute.Sitemap =
    experiences?.map((experience) => ({
      url: absoluteUrl(`/experiences/${experience.id}`),
      lastModified: experience.published_at ?? experience.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) ?? [];

  return [
    ...STATIC_ROUTES,
    ...destinationRoutes,
    ...guideRoutes,
    ...storyRoutes,
    ...listingEntries,
    ...experienceEntries,
  ];
}
