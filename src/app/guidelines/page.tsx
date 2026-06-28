import Link from "next/link";
import { brand } from "@/lib/brand";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export const metadata = { title: "Community Guidelines" };

export default function CommunityGuidelinesPage() {
  return (
    <Section background="white">
      <Container size="md" className="py-16 prose prose-forest max-w-none">
        <h1 className="text-3xl font-bold text-forest">Community Guidelines</h1>
        <p className="text-charcoal-light">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <p className="text-charcoal-light leading-relaxed mt-6">
          {brand.name} connects travelers with host families for authentic cultural immersion — not
          short-term rentals or transactional tourism. These guidelines help every member feel safe,
          respected, and welcome. By using the platform, you agree to follow them.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Our values</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>
            <strong className="text-forest">Respect</strong> — Treat hosts, travelers, and their
            homes with the same care you would expect in return.
          </li>
          <li>
            <strong className="text-forest">Authenticity</strong> — Be honest in your profile,
            listing, requests, and reviews. Misrepresentation undermines trust for everyone.
          </li>
          <li>
            <strong className="text-forest">Cultural curiosity</strong> — Approach differences with
            openness, humility, and a willingness to learn.
          </li>
          <li>
            <strong className="text-forest">Safety</strong> — Look out for yourself and others.
            Report concerns promptly so we can respond.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">For travelers</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>Introduce yourself thoughtfully when requesting a stay — hosts are opening their homes.</li>
          <li>Honor agreed dates, guest counts, and house rules once a stay is confirmed.</li>
          <li>Communicate clearly about arrival plans, dietary needs, and any changes to your trip.</li>
          <li>Do not pressure hosts for contact details, off-platform payment, or stays outside the platform.</li>
          <li>Leave honest, constructive reviews after completed trips.</li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">For hosts</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>Keep your listing accurate — capacity, pricing, amenities, blocked dates, and availability.</li>
          <li>Respond to stay requests in a timely way and communicate clearly when approving or declining.</li>
          <li>Share contact details only through the platform after a stay is confirmed.</li>
          <li>Withdraw a confirmed stay only when truly necessary, with a clear explanation for the guest.</li>
          <li>Welcome travelers as guests in your home, not as anonymous bookings.</li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">Messaging &amp; stay requests</h2>
        <p className="text-charcoal-light leading-relaxed">
          Use in-platform messaging for stay-related communication. Do not use {brand.name} to
          solicit unrelated services, send spam, or move transactions off-platform to avoid fees or
          verification. Harassment, threats, discriminatory language, or sexual content are never
          allowed.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Reviews &amp; feedback</h2>
        <p className="text-charcoal-light leading-relaxed">
          Reviews must reflect your genuine experience. Do not post fake, retaliatory, or paid
          reviews. Keep feedback specific and fair. Reviews that violate these guidelines may be
          moderated or removed.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">What is not allowed</h2>
        <ul className="list-disc pl-6 text-charcoal-light space-y-2">
          <li>Discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or nationality</li>
          <li>Fraud, impersonation, or falsified verification documents</li>
          <li>Harassment, bullying, hate speech, or violence</li>
          <li>Illegal activity, weapons, or drugs on stays or experiences</li>
          <li>Commercial exploitation of the platform without authorization</li>
          <li>Sharing another member&apos;s private information without consent</li>
        </ul>

        <h2 className="text-xl font-semibold text-forest mt-8">Reporting &amp; enforcement</h2>
        <p className="text-charcoal-light leading-relaxed">
          If you see behavior that violates these guidelines, use the report tools on profiles and
          listings or contact our team. We review reports promptly and may warn, suspend, or remove
          accounts that break the rules. Serious or repeated violations can result in permanent
          removal from {brand.name}.
        </p>
        <p className="text-charcoal-light leading-relaxed">
          Learn more about how we build trust in our{" "}
          <Link href="/trust-center" className="text-forest underline">
            Trust Center
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Contact</h2>
        <p className="text-charcoal-light">
          Questions about these guidelines? Email{" "}
          <a href="mailto:hello@forebeyond.com" className="text-forest underline">
            hello@forebeyond.com
          </a>
          . For privacy-related requests, see our{" "}
          <Link href="/privacy" className="text-forest underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Container>
    </Section>
  );
}
