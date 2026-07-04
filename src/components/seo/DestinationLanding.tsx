"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/design/PageHero";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildDestinationJsonLd } from "@/lib/json-ld";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { DestinationSection } from "@/lib/seo/destination-catalog";

type DestinationLandingProps = {
  breadcrumbs: BreadcrumbItem[];
  jsonLdPath: string;
  jsonLdName: string;
  jsonLdDescription: string;
  image: string;
  imageAlt: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  sections: DestinationSection[];
  searchHref: string;
  searchLabel: string;
  cityLinks?: { label: string; href: string; description?: string }[];
};

export function DestinationLanding({
  breadcrumbs,
  jsonLdPath,
  jsonLdName,
  jsonLdDescription,
  image,
  imageAlt,
  heroTitle,
  heroSubtitle,
  intro,
  sections,
  searchHref,
  searchLabel,
  cityLinks = [],
}: DestinationLandingProps) {
  const t = useTranslations();
  const breadcrumbJsonItems = breadcrumbs.map((item) => ({
    name: item.label,
    path: item.href ?? jsonLdPath,
  }));

  return (
    <>
      <JsonLd
        data={buildDestinationJsonLd({
          name: jsonLdName,
          description: jsonLdDescription,
          path: jsonLdPath,
          image,
          breadcrumbs: breadcrumbJsonItems,
        })}
      />
      <PageHero
        image={image}
        imageAlt={imageAlt}
        eyebrow={t("destinations.eyebrow")}
        title={heroTitle}
        subtitle={heroSubtitle}
        height="lg"
      >
        <ButtonLink href={searchHref} variant="primary" size="lg">
          {searchLabel}
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </PageHero>

      <Section background="cream">
        <Container size="md">
          <Breadcrumbs items={breadcrumbs} />
          <p className="text-lg md:text-xl text-charcoal-light leading-relaxed">{intro}</p>
          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-semibold text-forest mb-3">{section.title}</h2>
                <p className="text-base text-charcoal-light leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {cityLinks.length > 0 && (
        <Section background="white">
          <Container>
            <h2 className="text-2xl md:text-3xl font-bold text-forest mb-8">{t("destinations.exploreCities")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityLinks.map((city) => (
                <Card key={city.href} variant="outline" padding="lg" className="hover-lift">
                  <h3 className="text-xl font-semibold text-forest">
                    <Link href={city.href} className="hover:underline">
                      {city.label}
                    </Link>
                  </h3>
                  {city.description && (
                    <p className="mt-2 text-sm text-charcoal-light leading-relaxed">
                      {city.description}
                    </p>
                  )}
                  <Link
                    href={city.href}
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-forest hover:underline"
                  >
                    {t("destinations.viewCityGuide")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section background="sage">
        <Container size="sm" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-forest">{t("destinations.readyTitle")}</h2>
          <p className="mt-4 text-charcoal-light leading-relaxed">
            {t("destinations.readyDesc")}
          </p>
          <ButtonLink href={searchHref} variant="primary" size="lg" className="mt-8">
            {searchLabel}
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </Container>
      </Section>
    </>
  );
}
