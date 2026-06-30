import { brand } from "@/lib/brand";
import { LegalPageShell } from "@/components/ui/LegalPageShell";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "How Fore Beyond collects, uses, and protects your personal information.",
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <section className="space-y-4">
        <h2>Our Commitment</h2>
        <p>
          {brand.name} is a trust-first cultural immersion platform. We collect only what we need to
          connect travelers with host families safely and meaningfully.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Information We Collect</h2>
        <ul>
          <li>Account information: name, email, phone, profile details</li>
          <li>Verification documents: government ID, address proof, video verification</li>
          <li>Usage data: how you interact with the platform (with consent)</li>
          <li>Communications: messages related to stay requests</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>How We Protect Your Data</h2>
        <p>
          Personal information — including email, phone, and full name — is hidden from other members
          until a stay request is approved. All database tables use Row Level Security. Verification
          documents are encrypted and access-controlled.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Your Rights</h2>
        <ul>
          <li>Access and download your data at any time</li>
          <li>Update privacy settings and cookie preferences</li>
          <li>Request account deletion with a 7-day grace period</li>
          <li>Withdraw consent for analytics and marketing cookies</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Cookies</h2>
        <p>
          We use essential cookies for authentication. Analytics and marketing cookies require your
          explicit consent. You can manage preferences in Privacy Settings or via the cookie banner on
          first visit.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Contact</h2>
        <p>
          Questions about privacy? Email us at{" "}
          <a href="mailto:privacy@forebeyond.com">privacy@forebeyond.com</a>
        </p>
      </section>
    </LegalPageShell>
  );
}
