import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createPageMetadata } from "@/lib/site-metadata";
import { GUIDE_ARTICLES } from "@/lib/seo/guides-catalog";
import { PageHero } from "@/components/design/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { sampleImages } from "@/lib/sample-images";

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
        image={sampleImages.experiencesWorkshop}
        imageAlt="Travelers learning a local craft during a cultural immersion experience"
        eyebrow="Guides"
        title="Cultural travel guides"
        subtitle="Practical advice for authentic travel experiences, homestays, and cultural exchange."
        height="md"
      />
      <Section background="cream">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDE_ARTICLES.map((guide) => (
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
