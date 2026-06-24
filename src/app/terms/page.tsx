import { brand } from "@/lib/brand";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <Section background="white">
      <Container size="md" className="py-16 prose prose-forest max-w-none">
        <h1 className="text-3xl font-bold text-forest">Terms of Service</h1>
        <p className="text-charcoal-light">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

        <h2 className="text-xl font-semibold text-forest mt-8">Agreement</h2>
        <p className="text-charcoal-light leading-relaxed">
          By using {brand.name}, you agree to these terms. {brand.name} is a trust-first cultural
          immersion platform — not a vacation rental service.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Membership</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>You must be 18 or older to create an account</li>
          <li>You agree to provide accurate information during verification</li>
          <li>Your Trust Score reflects verified identity, completed trips, and reviews</li>
          <li>Hosts and travelers must complete verification before stays</li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">Cultural Immersion Stays</h2>
        <p className="text-charcoal-light leading-relaxed">
          Stays on {brand.name} are cultural immersion experiences with local families.
          Personal contact information is shared only after a stay request is approved by both parties.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Trust & Verification</h2>
        <p className="text-charcoal-light leading-relaxed">
          Members participate in identity verification, and may complete phone, address, and video
          verification. {brand.name} reserves the right to suspend accounts that violate community
          standards or misrepresent their identity.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Account Termination</h2>
        <p className="text-charcoal-light leading-relaxed">
          You may delete your account at any time. Deletion takes effect after a 7-day grace period.
          {brand.name} may terminate accounts that violate these terms or harm community safety.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Contact</h2>
        <p className="text-charcoal-light">
          Questions? Email{" "}
          <a href="mailto:hello@forebeyond.com" className="text-forest underline">
            hello@forebeyond.com
          </a>
        </p>
      </Container>
    </Section>
  );
}
