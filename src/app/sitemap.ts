import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site-metadata";
import { getDestinationCountries } from "@/lib/seo/destination-catalog";
import { GUIDE_ARTICLES } from "@/lib/seo/guides-catalog";
import { TRAVELER_STORIES } from "@/lib/seo/stories-catalog";
import { JAPAN_HOST_SEO_PAGES } from "@/lib/seo/japan-host-catalog";

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

  const { data: experiences } = await supabase
    .from("public_experiences")
    .select("id, published_at, created_at");

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

  const experienceEntries: MetadataRoute.Sitemap =
    experiences?.map((experience) => ({
      url: absoluteUrl(`/experiences/${experience.id}`),
      lastModified: experience.published_at ?? experience.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) ?? [];

  const japanHostRoutes: MetadataRoute.Sitemap = JAPAN_HOST_SEO_PAGES.map((page) => ({
    url: absoluteUrl(`/${page.slug}`),
    changeFrequency: "weekly" as const,
    priority:
      page.type === "core" ? 0.95 : page.type === "city" ? 0.9 : page.type === "intent" ? 0.85 : 0.8,
  }));

  return [
    ...STATIC_ROUTES,
    ...destinationRoutes,
    ...guideRoutes,
    ...storyRoutes,
    ...japanHostRoutes,
    ...experienceEntries,
  ];
}
