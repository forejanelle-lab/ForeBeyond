import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createPageMetadata } from "@/lib/site-metadata";
import { GUIDE_ARTICLES, getGuideArticle } from "@/lib/seo/guides-catalog";
import { PageHero } from "@/components/design/PageHero";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildArticleJsonLd } from "@/lib/json-ld";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideArticle(slug);
  if (!guide) {
    return createPageMetadata({
      title: "Guide Not Found",
      description: "This travel guide could not be found.",
      path: `/guides/${slug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: guide.title,
    description: guide.metaDescription,
    path: `/guides/${guide.slug}`,
    image: guide.image,
  });
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideArticle(slug);
  if (!guide) notFound();

  const path = `/guides/${guide.slug}`;

  return (
    <>
      <JsonLd
        data={buildArticleJsonLd({
          title: guide.title,
          description: guide.metaDescription,
          path,
          image: guide.image,
          datePublished: guide.publishedAt,
          dateModified: guide.updatedAt,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path },
          ],
        })}
      />
      <PageHero
        image={guide.image}
        imageAlt={guide.imageAlt}
        eyebrow="Guide"
        title={guide.heroTitle}
        subtitle={guide.heroSubtitle}
        height="lg"
      />
      <Section background="cream">
        <Container size="md">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Guides", href: "/guides" },
              { label: guide.title },
            ]}
          />
          <p className="text-lg text-charcoal-light leading-relaxed">{guide.intro}</p>
          <div className="mt-10 space-y-10">
            {guide.sections.map((section) => (
              <article key={section.heading}>
                <h2 className="text-2xl font-semibold text-forest mb-3">{section.heading}</h2>
                <p className="text-base text-charcoal-light leading-relaxed">{section.body}</p>
              </article>
            ))}
          </div>
          {guide.relatedDestinations.length > 0 && (
            <div className="mt-12 pt-8 border-t border-sage-dark/30">
              <h2 className="text-lg font-semibold text-forest mb-4">Related destinations</h2>
              <ul className="space-y-2">
                {guide.relatedDestinations.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline"
                    >
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
