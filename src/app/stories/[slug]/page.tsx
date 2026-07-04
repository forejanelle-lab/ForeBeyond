import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createPageMetadata } from "@/lib/site-metadata";
import { TRAVELER_STORIES, getTravelerStory } from "@/lib/seo/stories-catalog";
import { PageHero } from "@/components/design/PageHero";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildArticleJsonLd } from "@/lib/json-ld";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function generateStaticParams() {
  return TRAVELER_STORIES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getTravelerStory(slug);
  if (!story) {
    return createPageMetadata({
      title: "Story Not Found",
      description: "This traveler story could not be found.",
      path: `/stories/${slug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: story.title,
    description: story.metaDescription,
    path: `/stories/${story.slug}`,
    image: story.image,
  });
}

export default async function TravelerStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getTravelerStory(slug);
  if (!story) notFound();

  const path = `/stories/${story.slug}`;

  return (
    <>
      <JsonLd
        data={buildArticleJsonLd({
          title: story.title,
          description: story.metaDescription,
          path,
          image: story.image,
          datePublished: story.publishedAt,
          authorName: story.author,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Stories", path: "/stories" },
            { name: story.title, path },
          ],
        })}
      />
      <PageHero
        image={story.image}
        imageAlt={story.imageAlt}
        eyebrow={`${story.destination} · ${story.author}`}
        title={story.heroTitle}
        subtitle={story.heroSubtitle}
        height="lg"
      />
      <Section background="cream">
        <Container size="md">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Stories", href: "/stories" },
              { label: story.title },
            ]}
          />
          <p className="text-lg text-charcoal-light leading-relaxed italic border-l-4 border-gold pl-5">
            {story.excerpt}
          </p>
          <div className="mt-10 space-y-10">
            {story.sections.map((section) => (
              <article key={section.heading}>
                <h2 className="text-2xl font-semibold text-forest mb-3">{section.heading}</h2>
                <p className="text-base text-charcoal-light leading-relaxed">{section.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-sage-dark/30">
            <ButtonLink href={story.relatedHref} variant="primary" size="md">
              Explore this destination
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
