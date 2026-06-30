import { brand } from "@/lib/brand";
import { LegalPageShell } from "@/components/ui/LegalPageShell";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description: "Terms of service for using the Fore Beyond cultural immersion platform.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <section className="space-y-4">
        <h2>Agreement</h2>
        <p>
          By using {brand.name}, you agree to these terms. {brand.name} is a trust-first cultural
          immersion platform — not a vacation rental service.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Membership</h2>
        <ul>
          <li>You must be 18 or older to create an account</li>
          <li>You agree to provide accurate information during verification</li>
          <li>Your Trust Score reflects verified identity, completed trips, and reviews</li>
          <li>Hosts and travelers must complete verification before stays</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Cultural Immersion Stays</h2>
        <p>
          Stays on {brand.name} are cultural immersion experiences with local families. Personal
          contact information is shared only after a stay request is approved by both parties.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Trust & Verification</h2>
        <p>
          Members participate in identity verification, and may complete phone, address, and video
          verification. {brand.name} reserves the right to suspend accounts that violate community
          standards or misrepresent their identity.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Account Termination</h2>
        <p>
          You may delete your account at any time. Deletion takes effect after a 7-day grace period.
          {brand.name} may terminate accounts that violate these terms or harm community safety.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Contact</h2>
        <p>
          Questions? Email <a href="mailto:hello@forebeyond.com">hello@forebeyond.com</a>
        </p>
      </section>
    </LegalPageShell>
  );
}
