import Link from "next/link";
import { createPageMetadata } from "@/lib/site-metadata";
import { getDestinationCountries } from "@/lib/seo/destination-catalog";
import { PageHero } from "@/components/design/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { sampleImages } from "@/lib/sample-images";
import { ArrowRight } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Destinations — Cultural Immersion Travel",
  description:
    "Explore homestay destinations worldwide. Cultural immersion travel with verified local hosts in Japan, Italy, Mexico, Spain, and more.",
  path: "/destinations",
});

export default function DestinationsIndexPage() {
  const countries = getDestinationCountries();

  return (
    <>
      <PageHero
        image={sampleImages.heroTravel}
        imageAlt="Travelers exploring destinations for cultural immersion homestays"
        eyebrow="Destinations"
        title="Cultural immersion destinations"
        subtitle="Verified local hosts for authentic travel experiences and meaningful homestays worldwide."
        height="md"
      />
      <Section background="cream">
        <Container>
          <p className="text-lg text-charcoal-light leading-relaxed max-w-3xl mb-10">
            Fore Beyond is a trust-first platform for cultural exchange travel — not vacation
            rentals. Browse destination guides and find verified host families ready to welcome
            travelers seeking immersive experiences.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {countries.map((country) => (
              <Card key={country.slug} variant="outline" padding="lg" className="hover-lift">
                <h2 className="text-xl font-semibold text-forest">
                  <Link href={`/destinations/${country.slug}`} className="hover:underline">
                    {country.name}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-charcoal-light leading-relaxed line-clamp-3">
                  {country.intro}
                </p>
                <Link
                  href={`/destinations/${country.slug}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-forest hover:underline"
                >
                  Explore {country.name}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
