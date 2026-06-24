import { brand } from "@/lib/brand";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <Section background="white">
      <Container size="md" className="py-16 prose prose-forest max-w-none">
        <h1 className="text-3xl font-bold text-forest">Privacy Policy</h1>
        <p className="text-charcoal-light">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2 className="text-xl font-semibold text-forest mt-8">Our Commitment</h2>
        <p className="text-charcoal-light leading-relaxed">
          {brand.name} is a trust-first cultural immersion platform. We collect only what we need
          to connect travelers with host families safely and meaningfully.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Information We Collect</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>Account information: name, email, phone, profile details</li>
          <li>Verification documents: government ID, address proof, video verification</li>
          <li>Usage data: how you interact with the platform (with consent)</li>
          <li>Communications: messages related to stay requests</li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">How We Protect Your Data</h2>
        <p className="text-charcoal-light leading-relaxed">
          Personal information — including email, phone, and full name — is hidden from other
          members until a stay request is approved. All database tables use Row Level Security.
          Verification documents are encrypted and access-controlled.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Your Rights</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>Access and download your data at any time</li>
          <li>Update privacy settings and cookie preferences</li>
          <li>Request account deletion with a 7-day grace period</li>
          <li>Withdraw consent for analytics and marketing cookies</li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">Cookies</h2>
        <p className="text-charcoal-light leading-relaxed">
          We use essential cookies for authentication. Analytics and marketing cookies require
          your explicit consent. You can manage preferences in Privacy Settings or via the cookie
          banner on first visit.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Contact</h2>
        <p className="text-charcoal-light">
          Questions about privacy? Email us at{" "}
          <a href="mailto:privacy@forebeyond.com" className="text-forest underline">
            privacy@forebeyond.com
          </a>
        </p>
      </Container>
    </Section>
  );
}
