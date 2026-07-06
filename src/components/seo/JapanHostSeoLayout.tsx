import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Shield, Users } from "lucide-react";
import { PageHero } from "@/components/design/PageHero";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildHostSeoPageJsonLd } from "@/lib/json-ld";
import {
  getJapanHostCtaHref,
  type JapanHostSeoPage,
} from "@/lib/seo/japan-host-catalog";
import { JapanHostSeoCta } from "@/components/seo/JapanHostSeoCta";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";

type JapanHostSeoLayoutProps = {
  page: JapanHostSeoPage;
};

function buildBreadcrumbs(page: JapanHostSeoPage): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (page.type === "partnership") {
    items.push({ label: "Partnerships", href: "/partner-language-schools-japan" });
  } else {
    items.push({ label: "Host in Japan", href: "/become-a-host-japan" });
  }

  items.push({ label: page.heroTitle });
  return items;
}

export function JapanHostSeoLayout({ page }: JapanHostSeoLayoutProps) {
  const path = `/${page.slug}`;
  const breadcrumbs = buildBreadcrumbs(page);
  const isPartnership = page.ctaKind === "partnership";
  const heroVariant = page.heroStyle === "solid" ? "solid" : "image";

  const breadcrumbJsonItems = breadcrumbs
    .filter((item) => item.href)
    .map((item) => ({
      name: item.label,
      path: item.href!,
    }));
  breadcrumbJsonItems.push({ name: page.heroTitle, path });

  return (
    <>
      <JsonLd
        data={buildHostSeoPageJsonLd({
          title: page.pageTitle,
          description: page.metaDescription,
          path,
          image: page.image,
          breadcrumbs: breadcrumbJsonItems,
          faq: page.faq,
        })}
      />

      <PageHero
        image={page.image}
        imageAlt={page.imageAlt}
        variant={heroVariant}
        eyebrow={
          page.type === "partnership"
            ? "Institutional partnerships"
            : page.type === "city"
              ? `Host families · ${page.cityName}`
              : "Host families in Japan"
        }
        title={page.heroTitle}
        subtitle={page.heroSubtitle}
        height="lg"
        priority
      >
        <JapanHostSeoCta
          ctaKind={page.ctaKind}
          ctaLabel={page.ctaLabel}
          href={getJapanHostCtaHref(page)}
        />
      </PageHero>

      <Section background="cream">
        <Container size="md">
          <Breadcrumbs items={breadcrumbs} />
          <p className="text-lg md:text-xl text-charcoal-light leading-relaxed mt-6">{page.intro}</p>

          {page.type === "city" && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Card variant="outline" padding="md" className="space-y-2">
                <div className="flex items-center gap-2 text-forest font-semibold">
                  <MapPin className="h-4 w-4" />
                  Demand signal
                </div>
                <p className="text-sm text-charcoal-light leading-relaxed">{page.demandSignal}</p>
              </Card>
              <Card variant="outline" padding="md" className="space-y-2">
                <div className="flex items-center gap-2 text-forest font-semibold">
                  <Users className="h-4 w-4" />
                  Who you&apos;ll host
                </div>
                <p className="text-sm text-charcoal-light leading-relaxed">{page.studentProfile}</p>
              </Card>
              <Card variant="outline" padding="md" className="space-y-2 sm:col-span-2">
                <Badge variant="gold" className="mb-1">
                  Estimated earnings (not guaranteed)
                </Badge>
                <p className="text-base font-medium text-forest">{page.earningRange}</p>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  {page.languageSchoolPresence}
                </p>
              </Card>
            </div>
          )}

          <div className="mt-10 space-y-8">
            {page.sections.map((section) => (
              <article key={section.title}>
                <h2 className="text-2xl font-semibold text-forest mb-3">{section.title}</h2>
                <p className="text-base text-charcoal-light leading-relaxed">{section.body}</p>
              </article>
            ))}
          </div>

          {!isPartnership && page.type === "core" && (
            <div className="mt-10 rounded-2xl border border-sage-dark/30 bg-white p-6 md:p-8">
              <div className="flex items-center gap-2 text-forest font-semibold mb-4">
                <Shield className="h-5 w-5" />
                Host application process
              </div>
              <ol className="space-y-3 text-sm text-charcoal-light">
                {[
                  "Create your Fore Beyond account",
                  "Complete host onboarding and verification",
                  "Publish your household profile with clear house rules",
                  "Review placement requests from partner programs and travelers",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-forest mt-0.5" />
                    <span>
                      <strong className="text-forest">{index + 1}.</strong> {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Container>
      </Section>

      {page.faq.length > 0 && (
        <Section background="white">
          <Container size="md">
            <h2 className="text-2xl md:text-3xl font-bold text-forest mb-8">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {page.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-sage-dark/30 bg-cream/40 px-5 py-4 open:bg-white"
                >
                  <summary className="cursor-pointer list-none font-semibold text-forest pr-6 marker:content-none">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm text-charcoal-light leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {page.relatedLinks.length > 0 && (
        <Section background="white">
          <Container>
            <h2 className="text-2xl font-bold text-forest mb-6">Related resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.relatedLinks.map((related) => (
                <Card key={related.href} variant="outline" padding="md" className="hover-lift">
                  <Link href={related.href} className="text-sm font-medium text-forest hover:underline">
                    {related.label}
                    <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
                  </Link>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section background="sage">
        <Container size="sm" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-forest">
            {isPartnership
              ? "Partner with Fore Beyond"
              : "Ready to host international travelers?"}
          </h2>
          <p className="mt-4 text-charcoal-light leading-relaxed">
            {isPartnership
              ? "Tell us about your institution, cities, and intake calendar. Our partnership team will respond with a pilot structure matched to your homestay needs."
              : "Join verified host families across Japan. Apply today — verification and onboarding are built into the process."}
          </p>
          <JapanHostSeoCta
            ctaKind={page.ctaKind}
            ctaLabel={page.ctaLabel}
            href={getJapanHostCtaHref(page)}
            className="mt-8"
          />
        </Container>
      </Section>
    </>
  );
}
