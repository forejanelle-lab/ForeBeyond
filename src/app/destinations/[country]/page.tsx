import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/site-metadata";
import {
  buildDestinationSearchHref,
  getDestinationCountries,
  getDestinationCountry,
} from "@/lib/seo/destination-catalog";
import { DestinationLanding } from "@/components/seo/DestinationLanding";

export function generateStaticParams() {
  return getDestinationCountries().map((country) => ({ country: country.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const country = getDestinationCountry(countrySlug);
  if (!country) {
    return createPageMetadata({
      title: "Destination Not Found",
      description: "This destination guide could not be found.",
      path: `/destinations/${countrySlug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: country.pageTitle,
    description: country.metaDescription,
    path: `/destinations/${country.slug}`,
    image: country.image,
  });
}

export default async function DestinationCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const country = getDestinationCountry(countrySlug);
  if (!country) notFound();

  return (
    <DestinationLanding
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Destinations", href: "/destinations" },
        { label: country.name },
      ]}
      jsonLdPath={`/destinations/${country.slug}`}
      jsonLdName={country.pageTitle}
      jsonLdDescription={country.metaDescription}
      image={country.image}
      imageAlt={country.imageAlt}
      heroTitle={country.heroTitle}
      heroSubtitle={country.heroSubtitle}
      intro={country.intro}
      sections={country.sections}
      searchHref={buildDestinationSearchHref(country.searchCountry)}
      searchLabel={`Browse families in ${country.name}`}
      cityLinks={country.cities.map((city) => ({
        label: city.name,
        href: `/destinations/${country.slug}/${city.slug}`,
        description: city.heroSubtitle,
      }))}
    />
  );
}
