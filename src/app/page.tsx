import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import { getPopularDestinations } from "@/lib/destinations";
import { sampleImages } from "@/lib/sample-images";
import { HeroSearchBar } from "@/components/design/HeroSearchBar";
import { TrustIndicators } from "@/components/design/TrustIndicators";
import { DestinationCard } from "@/components/design/DestinationCard";
import { SectionHeader } from "@/components/design/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";

import type { Profile } from "@/types/database";

const steps = [
  { step: "01", title: "Create Your Profile", description: "Tell us about your interests and what you hope to discover." },
  { step: "02", title: "Get Verified", description: "Complete trust verification so families know you're genuine." },
  { step: "03", title: "Find Your Match", description: "Browse verified host families and cultural experiences worldwide." },
  { step: "04", title: "Immerse & Connect", description: "Live with a local family and create memories that last a lifetime." },
];

const trustPillars = [
  "Government ID verification",
  "Background checks for hosts",
  "Community vouching system",
  "24/7 safety support",
  "Transparent reviews",
  "Cultural sensitivity training",
];

export default async function HomePage() {
  const popularDestinations = await getPopularDestinations();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isHostUser = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isHostUser = (profile as Pick<Profile, "role"> | null)?.role === "host";
  }

  return (
    <>
      <section className="relative min-h-[92vh] flex flex-col justify-end">
        <Image
          src={sampleImages.heroFamily}
          alt="Illustration of a brown host family welcoming a guest traveler to a warm home-cooked dinner"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 hero-overlay pointer-events-none" />
        <Container className="relative z-10 pb-20 md:pb-28 pt-32">
          <p className="text-sm font-medium text-gold mb-3 tracking-wide uppercase">
            {brand.name}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-2xl text-balance">
            Live like a local.<br />Belong anywhere.
          </h1>
          <p className="mt-3 text-white/80 text-sm italic">{brand.secondaryTagline}</p>
          <div className="mt-8 relative z-20">
            <HeroSearchBar
              disabled={isHostUser}
              disabledMessage="Please create a traveler account to search families."
            />
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
              title="Popular destinations"
              description="Verified host families offering authentic cultural immersion around the world."
              className="!mb-0"
            />
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline shrink-0"
            >
              Explore all families
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
            title="Not a vacation rental. A cultural bridge."
            description={brand.mission}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Trusted Families", desc: "Verified hosts who welcome you as family, not a guest." },
              { title: "Authentic Experiences", desc: "Cooking, ceremonies, markets — beyond tourist attractions." },
              { title: "Trust-First Safety", desc: "Identity verification, reviews, and community standards." },
            ].map((item) => (
              <Card key={item.title} variant="outline" padding="lg" className="hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-forest mb-2">{item.title}</h3>
                <p className="text-sm text-charcoal-light leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="how-it-works" background="sage">
        <Container>
          <SectionHeader align="center" title="How It Works" description="Your path from curious traveler to cultural insider." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <span className="text-4xl font-bold text-forest/15">{item.step}</span>
                <h3 className="text-lg font-semibold text-forest mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-charcoal-light leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="forest">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Built on trust, not transactions</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Every member goes through rigorous verification. Meaningful connection requires genuine trust.
              </p>
              <ButtonLink href="/trust-center" variant="gold" size="md" className="mt-6">
                Explore Trust Center
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trustPillars.map((pillar) => (
                <div key={pillar} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                  <span className="text-sm text-white/90">{pillar}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section background="cream">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-forest">Ready to travel deeper?</h2>
            <p className="mt-4 text-charcoal-light">{brand.tagline}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonLink href="/auth/sign-up" variant="primary" size="lg">
                Join as Traveler
              </ButtonLink>
              <ButtonLink href="/onboarding/host" variant="secondary" size="lg">
                Join as Host
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <TrackPageEvent event={AnalyticsEvents.HOMEPAGE_VIEW} />
    </>
  );
}
