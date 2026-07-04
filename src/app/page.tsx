import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Home, Plane } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPopularDestinations } from "@/lib/destinations";
import { sampleImages } from "@/lib/sample-images";
import { HeroSearchBar } from "@/components/design/HeroSearchBar";
import { TrustIndicators } from "@/components/design/TrustIndicators";
import { DestinationCard } from "@/components/design/DestinationCard";
import { SectionHeader } from "@/components/design/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { BecomeHostButton } from "@/components/home/BecomeHostButton";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildHomePageJsonLd } from "@/lib/json-ld";
import { getServerTranslations } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/site-metadata";
import { TRAVELER_ACCOUNT_SEARCH_MESSAGE } from "@/lib/traveler-verification";
import type { Profile } from "@/types/database";

export const metadata = createPageMetadata({
  title: "Cultural Immersion Travel with Verified Local Hosts",
  description:
    "Fore Beyond connects verified local hosts and travelers for cultural immersion travel and authentic homestay experiences. Travel like a local or share your home — meaningful travel beyond hotels and tourism.",
  path: "/",
});

const homeSectionTitle = "!text-3xl md:!text-5xl lg:!text-[3.25rem]";
const homeSectionDescription = "text-lg md:text-xl leading-relaxed";

export default async function HomePage() {
  const { t } = await getServerTranslations();
  const popularDestinations = await getPopularDestinations();

  let isHostUser = false;
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isLoggedIn = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isHostUser = (profile as Pick<Profile, "role"> | null)?.role === "host";
    }
  } catch (error) {
    console.error("Homepage auth check failed:", error);
  }

  const steps = [
    { step: "01", title: t("home.step1Title"), description: t("home.step1Desc") },
    { step: "02", title: t("home.step2Title"), description: t("home.step2Desc") },
    { step: "03", title: t("home.step3Title"), description: t("home.step3Desc") },
    { step: "04", title: t("home.step4Title"), description: t("home.step4Desc") },
  ];

  const trustPillars = [
    t("home.trustPillarId"),
    t("home.trustPillarVideo"),
    t("home.trustPillarCommunity"),
    t("home.trustPillarSafety"),
    t("home.trustPillarReviews"),
    t("home.trustPillarTraining"),
  ];

  const missionPillars = [
    { title: t("home.pillarHostsTitle"), desc: t("home.pillarHostsDesc") },
    { title: t("home.pillarExperiencesTitle"), desc: t("home.pillarExperiencesDesc") },
    { title: t("home.pillarTrustTitle"), desc: t("home.pillarTrustDesc") },
  ];

  return (
    <>
      <JsonLd data={buildHomePageJsonLd()} />
      <section className="relative min-h-[92vh] flex flex-col justify-end">
        <Image
          src={sampleImages.homeHeroOutdoorMeal}
          alt="Travelers and hosts laughing together while sharing a home-cooked meal"
          fill
          className="object-cover object-center"
          priority
          unoptimized
          sizes="100vw"
        />
        <div className="absolute inset-0 hero-overlay-dark pointer-events-none" />
        <Container className="relative z-10 pb-20 md:pb-28 pt-32">
          <h1 className="hero-text-shadow text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-2xl text-balance">
            {t("home.heroTitleLine1")}
            <br />
            {t("home.heroTitleLine2")}
          </h1>
          <p className="hero-text-shadow mt-5 text-base md:text-lg text-white/90 leading-relaxed max-w-xl">
            {t("home.heroSubtitle")}
          </p>
          <div className="mt-8 relative z-20">
            <HeroSearchBar
              disabled={isHostUser}
              disabledMessage={TRAVELER_ACCOUNT_SEARCH_MESSAGE}
            />
            {!isLoggedIn && (
              <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-forest hover:bg-white/90 transition-colors shadow-md"
                >
                  {t("auth.createAccount")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-xs text-white/50 mr-1">{t("home.alreadyMember")}</span>
                <Link
                  href="/auth/sign-in?redirect=/trips"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-colors backdrop-blur-sm"
                >
                  <Plane className="h-3.5 w-3.5 opacity-80" />
                  {t("home.travelerLogin")}
                </Link>
                <Link
                  href="/auth/sign-in?redirect=/host/requests"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-colors backdrop-blur-sm"
                >
                  <Home className="h-3.5 w-3.5 opacity-80" />
                  {t("home.hostLogin")}
                </Link>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 pb-4">
            <TrustIndicators variant="hero" />
          </div>
        </Container>
      </section>

      {popularDestinations.length > 0 && (
      <Section background="cream" className="!pt-16 md:!pt-24 !pb-16 md:!pb-24">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
            <SectionHeader
              title={t("home.popularDestinations")}
              description={t("home.popularDestinationsDesc")}
              className="!mb-0"
            />
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-light hover:gap-2 transition-all shrink-0"
            >
              {t("home.allDestinations")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {popularDestinations.map((dest) => (
              <DestinationCard
                key={dest.name}
                name={dest.name}
                subtitle={dest.families}
                image={dest.image}
                href={dest.href}
                variant="featured"
              />
            ))}
          </div>
        </Container>
      </Section>
      )}

      <Section id="mission" background="white">
        <Container>
          <SectionHeader
            align="center"
            title={t("home.missionTitle")}
            description={t("home.missionDesc")}
            titleClassName={homeSectionTitle}
            descriptionClassName={`${homeSectionDescription} max-w-3xl mx-auto`}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {missionPillars.map((item) => (
              <Card key={item.title} variant="outline" padding="lg" className="hover-lift">
                <h3 className="text-xl font-semibold text-forest mb-2">{item.title}</h3>
                <p className="text-base text-charcoal-light leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="how-it-works" background="sage">
        <Container>
          <SectionHeader
            align="center"
            title={t("home.howItWorksTitle")}
            description={t("home.howItWorksDesc")}
            titleClassName={homeSectionTitle}
            descriptionClassName={homeSectionDescription}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((item) => (
              <div
                key={item.step}
                className="text-center rounded-2xl p-6 hover-lift hover:bg-white/60"
              >
                <span className="text-5xl font-bold text-forest/15">{item.step}</span>
                <h3 className="text-xl font-semibold text-forest mt-2 mb-2">{item.title}</h3>
                <p className="text-base text-charcoal-light leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="forest">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight">
                {t("home.trustTitle")}
              </h2>
              <p className="mt-5 text-lg md:text-xl text-white/75 leading-relaxed">
                {t("home.trustDesc")}
              </p>
              <ButtonLink
                href="/trust-center"
                variant="ghost"
                size="md"
                className="mt-6 border border-sage/50 bg-sage/20 !text-white backdrop-blur-sm hover:bg-sage/30 hover:!text-white focus-visible:ring-sage/40 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {t("home.exploreTrustCenter")}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trustPillars.map((pillar) => (
                <div
                  key={pillar}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 hover-lift hover:bg-white/15"
                >
                  <CheckCircle2 className="h-5 w-5 text-gold-light shrink-0" />
                  <span className="text-base text-white/90">{pillar}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section background="cream">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            <div className="rounded-3xl overflow-hidden shadow-2xl bg-white hover-lift p-10 md:p-12 lg:p-14 text-center flex flex-col">
              <h2 className="text-3xl md:text-4xl font-bold text-forest leading-tight text-balance">
                {t("home.travelTitleLine1")}
                <br />
                {t("home.travelTitleLine2")}
              </h2>
              <p className="mt-6 text-base md:text-lg text-charcoal-light leading-relaxed flex-1">
                {t("home.travelDesc")}
              </p>
              <ButtonLink
                href="/search"
                variant="primary"
                size="lg"
                className="mt-10 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {t("home.findYourStay")}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-2xl bg-white hover-lift p-10 md:p-12 lg:p-14 text-center flex flex-col">
              <h2 className="text-3xl md:text-4xl font-bold text-forest leading-tight text-balance">
                {t("home.hostTitleLine1")}
                <br />
                {t("home.hostTitleLine2")}
              </h2>
              <p className="mt-6 text-base md:text-lg text-charcoal-light leading-relaxed flex-1">
                {t("home.hostDesc")}
              </p>
              <BecomeHostButton isLoggedIn={isLoggedIn} />
            </div>
          </div>
        </Container>
      </Section>

      <TrackPageEvent event={AnalyticsEvents.HOMEPAGE_VIEW} />
    </>
  );
}
