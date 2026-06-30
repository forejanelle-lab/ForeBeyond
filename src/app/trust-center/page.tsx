import {
  CheckCircle2,
  Users,
  Eye,
  Lock,
  Heart,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { SectionHeader } from "@/components/design/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Trust Center",
  description: "Learn how Fore Beyond verifies hosts and travelers for safe, authentic cultural travel.",
  path: "/trust-center",
});

const trustLayers = [
  {
    icon: FileCheck,
    title: "Identity Verification",
    description:
      "Every member verifies their government-issued ID. We use industry-leading document verification to confirm authenticity.",
  },
  {
    icon: BadgeCheck,
    title: "Multi-Step Verification",
    description:
      "Phone, government ID, selfie, and optional video verification help confirm members are who they say they are.",
  },
  {
    icon: Users,
    title: "Community Vouching",
    description:
      "Experienced members vouch for new hosts and travelers, creating a web of trust that grows with our community.",
  },
  {
    icon: Eye,
    title: "Transparent Reviews",
    description:
      "Honest, detailed reviews from both travelers and hosts help everyone make informed decisions.",
  },
  {
    icon: Lock,
    title: "Data Protection",
    description:
      "Your personal information is encrypted and never shared without your explicit consent.",
  },
  {
    icon: Heart,
    title: "Cultural Sensitivity",
    description:
      "All members complete cultural sensitivity training to ensure respectful, meaningful exchanges.",
  },
];

const safetyCommitments = [
  "24/7 safety support hotline for all members",
  "Clear community guidelines and code of conduct",
  "Rapid response team for reported concerns",
  "Regular safety audits and platform improvements",
  "Insurance guidance for hosts and travelers",
  "Emergency contact protocols for every stay",
];

export default function TrustCenterPage() {
  return (
    <>
      <PageHero
        image={sampleImages.trustCenter}
        imageAlt="Trust and safety at Fore Beyond"
        eyebrow="Trust Center"
        title="Trust is not a feature. It's our foundation."
        subtitle={`${brand.name} was built from the ground up as a trust-first platform. Every layer protects, verifies, and empowers meaningful human connection.`}
        height="lg"
      />

      <Section background="white">
        <Container>
          <SectionHeader
            title="How we build trust"
            description="Six layers of protection that work together to keep our community safe and authentic."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trustLayers.map((layer) => (
              <Card key={layer.title} variant="outline" padding="lg" className="group hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/60 text-forest mb-4 group-hover:bg-forest group-hover:text-white transition-colors">
                  <layer.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-forest mb-2">{layer.title}</h3>
                <p className="text-sm text-charcoal-light leading-relaxed">{layer.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="sage">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-forest">Our safety commitments</h2>
              <p className="mt-4 text-charcoal-light leading-relaxed">
                Beyond verification, we provide ongoing support and resources to ensure
                every interaction on {brand.name} is safe, respectful, and enriching.
              </p>
            </div>
            <div className="space-y-3">
              {safetyCommitments.map((commitment) => (
                <div key={commitment} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-forest shrink-0" />
                  <span className="text-sm text-charcoal">{commitment}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section background="cream">
        <Container>
          <Card variant="elevated" padding="lg" className="text-center max-w-2xl mx-auto">
            <BadgeCheck className="h-12 w-12 text-gold mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-forest">Ready to get verified?</h2>
            <p className="mt-3 text-charcoal-light">
              Complete your verification to unlock the full {brand.name} experience.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <ButtonLink href="/trust-center/dashboard" variant="primary" size="lg">
                Open Trust Dashboard
              </ButtonLink>
              <ButtonLink href="/verification-center" variant="gold" size="lg">
                Go to Verification Center
              </ButtonLink>
              <ButtonLink href="/auth/sign-up" variant="outline" size="lg">
                Join {brand.name}
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
