import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  Users,
  Eye,
  Lock,
  Heart,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Trust Center",
};

const trustLayers = [
  {
    icon: FileCheck,
    title: "Identity Verification",
    description:
      "Every member verifies their government-issued ID. We use industry-leading document verification to confirm authenticity.",
  },
  {
    icon: Shield,
    title: "Background Checks",
    description:
      "Host families undergo comprehensive background screening before welcoming travelers into their homes.",
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
      <Section background="forest" className="!py-20">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="gold" className="mb-6">
              <Shield className="h-3 w-3" />
              Trust Center
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Trust is not a feature. It&apos;s our foundation.
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              {brand.name} was built from the ground up as a trust-first platform.
              Every layer of our community is designed to protect, verify, and empower
              meaningful human connection.
            </p>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-forest">How we build trust</h2>
            <p className="mt-4 text-charcoal-light">
              Six layers of protection that work together to keep our community safe and authentic.
            </p>
          </div>

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
              <Link href="/trust-center/dashboard">
                <Button variant="primary" size="lg">
                  Open Trust Dashboard
                </Button>
              </Link>
              <Link href="/verification-center">
                <Button variant="gold" size="lg">
                  Go to Verification Center
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" size="lg">
                  Join {brand.name}
                </Button>
              </Link>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
