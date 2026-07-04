import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/site-metadata";
import {
  buildDestinationSearchHref,
  getAllDestinationCityPages,
  getDestinationCity,
} from "@/lib/seo/destination-catalog";
import { DestinationLanding } from "@/components/seo/DestinationLanding";

export function generateStaticParams() {
  return getAllDestinationCityPages().map((city) => ({
    country: city.countrySlug,
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; city: string }>;
}) {
  const { country: countrySlug, city: citySlug } = await params;
  const city = getDestinationCity(countrySlug, citySlug);
  if (!city) {
    return createPageMetadata({
      title: "City Guide Not Found",
      description: "This city destination guide could not be found.",
      path: `/destinations/${countrySlug}/${citySlug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: city.pageTitle,
    description: city.metaDescription,
    path: `/destinations/${city.countrySlug}/${city.slug}`,
    image: city.image,
  });
}

export default async function DestinationCityPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>;
}) {
  const { country: countrySlug, city: citySlug } = await params;
  const city = getDestinationCity(countrySlug, citySlug);
  if (!city) notFound();

  return (
    <DestinationLanding
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Destinations", href: "/destinations" },
        { label: city.countryName, href: `/destinations/${city.countrySlug}` },
        { label: city.name },
      ]}
      jsonLdPath={`/destinations/${city.countrySlug}/${city.slug}`}
      jsonLdName={city.pageTitle}
      jsonLdDescription={city.metaDescription}
      image={city.image}
      imageAlt={city.imageAlt}
      heroTitle={city.heroTitle}
      heroSubtitle={city.heroSubtitle}
      intro={city.intro}
      sections={city.sections}
      searchHref={buildDestinationSearchHref(city.searchCountry, city.searchCity)}
      searchLabel={`Find host families in ${city.name}`}
    />
  );
}
