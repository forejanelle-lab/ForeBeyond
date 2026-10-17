import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createPageMetadata } from "@/lib/site-metadata";
import { GUIDE_ARTICLES } from "@/lib/seo/guides-catalog";
import { PageHero } from "@/components/design/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata = createPageMetadata({
  title: "Cultural Travel Guides",
  description:
    "Guides for cultural immersion travel, homestay experiences, and traveling like a local with verified hosts on Fore Beyond.",
  path: "/guides",
});

export default function GuidesIndexPage() {
  return (
    <>
      <PageHero
        variant="solid"
        eyebrow="Guides"
        title="Cultural travel guides"
        subtitle="Practical advice for authentic travel experiences, homestays, and cultural exchange."
        height="md"
      />
      <Section background="cream">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDE_ARTICLES.slice(0, 2).map((guide) => (
              <Card
                key={guide.slug}
                variant="outline"
                padding="lg"
                className="hover-lift border-forest/20 bg-white"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gold mb-2">
                  Getting started
                </p>
                <h2 className="text-xl font-semibold text-forest">
                  <Link href={`/guides/${guide.slug}`} className="hover:underline">
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-charcoal-light leading-relaxed line-clamp-3">
                  {guide.intro}
                </p>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-forest hover:underline"
                >
                  Read guide
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            ))}
          </div>

          <h2 className="mt-12 mb-6 text-lg font-semibold text-forest">More travel guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDE_ARTICLES.slice(2).map((guide) => (
              <Card key={guide.slug} variant="outline" padding="lg" className="hover-lift">
                <h2 className="text-xl font-semibold text-forest">
                  <Link href={`/guides/${guide.slug}`} className="hover:underline">
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-charcoal-light leading-relaxed line-clamp-3">
                  {guide.intro}
                </p>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-forest hover:underline"
                >
                  Read guide
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
