import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createPageMetadata } from "@/lib/site-metadata";
import { TRAVELER_STORIES } from "@/lib/seo/stories-catalog";
import { PageHero } from "@/components/design/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { sampleImages } from "@/lib/sample-images";

export const metadata = createPageMetadata({
  title: "Traveler Stories — Meaningful Travel",
  description:
    "Real traveler stories of cultural immersion, homestay experiences, and authentic travel with verified local hosts on Fore Beyond.",
  path: "/stories",
});

export default function StoriesIndexPage() {
  return (
    <>
      <PageHero
        image={sampleImages.homeTestimonial}
        imageAlt="Traveler reflecting on a meaningful cultural immersion journey abroad"
        eyebrow="Stories"
        title="Traveler stories"
        subtitle="Meaningful travel experiences from guests who chose cultural exchange over tourism."
        height="md"
      />
      <Section background="cream">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRAVELER_STORIES.map((story) => (
              <Card key={story.slug} variant="outline" padding="lg" className="hover-lift">
                <p className="text-xs font-medium text-charcoal-light uppercase tracking-wide">
                  {story.destination}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-forest">
                  <Link href={`/stories/${story.slug}`} className="hover:underline">
                    {story.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-charcoal-light leading-relaxed line-clamp-3">
                  {story.excerpt}
                </p>
                <Link
                  href={`/stories/${story.slug}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-forest hover:underline"
                >
                  Read story
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
