import Link from "next/link";
import {
  Globe,
  Heart,
  Home,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";

const features = [
  {
    icon: Users,
    title: "Trusted Local Families",
    description:
      "Connect with verified host families who welcome you into their homes and daily lives — not as a guest, but as family.",
  },
  {
    icon: Globe,
    title: "Authentic Cultural Experiences",
    description:
      "Go beyond tourist attractions. Cook traditional meals, celebrate local festivals, and learn customs passed down through generations.",
  },
  {
    icon: Heart,
    title: "Meaningful Human Connection",
    description:
      "Build lasting relationships across cultures. Every journey becomes a bridge between worlds.",
  },
  {
    icon: Shield,
    title: "Trust-First Platform",
    description:
      "Identity verification, background checks, and community vouching ensure safety for travelers and hosts alike.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Profile",
    description: "Sign up and tell us about yourself — your interests, values, and what you hope to discover.",
  },
  {
    step: "02",
    title: "Get Verified",
    description: "Complete our trust verification process so hosts and travelers know you're genuine.",
  },
  {
    step: "03",
    title: "Find Your Match",
    description: "Browse host families and cultural experiences that align with your journey goals.",
  },
  {
    step: "04",
    title: "Immerse & Connect",
    description: "Live with a local family, share meals, stories, and create memories that last a lifetime.",
  },
];

const trustPillars = [
  "Government ID verification",
  "Background checks for hosts",
  "Community vouching system",
  "24/7 safety support",
  "Transparent reviews",
  "Cultural sensitivity training",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-sage)_0%,_transparent_50%)] opacity-60" />
        <Container className="relative py-20 md:py-32">
          <div className="max-w-3xl">
            <Badge variant="gold" className="mb-6">
              <Sparkles className="h-3 w-3" />
              Trust-first cultural immersion
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-forest leading-tight text-balance">
              {brand.tagline}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-charcoal-light leading-relaxed max-w-2xl">
              {brand.mission}
            </p>
            <p className="mt-3 text-sm text-charcoal-light/70 italic">
              {brand.secondaryTagline}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/auth/sign-up">
                <Button variant="primary" size="lg">
                  Start Your Journey
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/onboarding/host">
                <Button variant="outline" size="lg">
                  <Home className="h-5 w-5" />
                  Become a Host
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <Section id="mission" background="white">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-forest">
              Not a vacation rental. A cultural bridge.
            </h2>
            <p className="mt-4 text-charcoal-light leading-relaxed">
              Fore Beyond is built on the belief that the richest travel experiences
              happen when you&apos;re welcomed into someone&apos;s world — their kitchen,
              their traditions, their stories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} variant="outline" padding="lg" className="group hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/60 text-forest mb-4 group-hover:bg-forest group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-forest mb-2">
                  {feature.title}
                </h3>
                <p className="text-charcoal-light leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* How It Works */}
      <Section id="how-it-works" background="sage">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-forest">
              How It Works
            </h2>
            <p className="mt-4 text-charcoal-light">
              Your path from curious traveler to cultural insider in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="relative">
                <span className="text-5xl font-bold text-forest/10">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-forest mt-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Trust */}
      <Section background="forest">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Built on trust, not transactions
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Every member of our community goes through a rigorous verification
                process. Because meaningful connection requires genuine trust.
              </p>
              <Link href="/trust-center" className="inline-block mt-6">
                <Button variant="gold" size="md">
                  Explore Trust Center
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trustPillars.map((pillar) => (
                <div
                  key={pillar}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                  <span className="text-sm text-white/90">{pillar}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section background="cream">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-forest">
              Ready to travel deeper?
            </h2>
            <p className="mt-4 text-charcoal-light">
              Join a community of travelers and hosts who believe the best journeys
              are the ones that change you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button variant="primary" size="lg">
                  Join as Traveler
                </Button>
              </Link>
              <Link href="/onboarding/host">
                <Button variant="secondary" size="lg">
                  Join as Host
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
      <TrackPageEvent event={AnalyticsEvents.HOMEPAGE_VIEW} />
    </>
  );
}
