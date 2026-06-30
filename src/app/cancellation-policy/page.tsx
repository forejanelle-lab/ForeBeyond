import Link from "next/link";
import { brand } from "@/lib/brand";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export const metadata = { title: "Cancellation Policy" };

export default function CancellationPolicyPage() {
  return (
    <Section background="white">
      <Container size="md" className="py-16 prose prose-forest max-w-none">
        <h1 className="text-3xl font-bold text-forest">Cancellation Policy</h1>
        <p className="text-charcoal-light">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Service fee</h2>
        <p className="text-charcoal-light leading-relaxed">
          {brand.name} only collects the Booking Protection Fee (service fee). Accommodation payment
          is made directly between the traveler and the host.
        </p>
        <p className="text-charcoal-light leading-relaxed">
          The Booking Protection Fee is <strong className="text-forest">non-refundable</strong> once
          payment has been completed. This fee covers identity verification, trust &amp; safety,
          secure messaging, booking management, customer support, and platform maintenance. These
          services begin immediately after payment.
        </p>
        <p className="text-charcoal-light leading-relaxed">
          The Booking Protection Fee may be refunded only if the host or {brand.name} cancels the
          booking.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Accommodation payment</h2>
        <p className="text-charcoal-light leading-relaxed">
          Stay payment is coordinated directly between the traveler and the host. {brand.name} does
          not process host payouts. Any refund of accommodation costs is at the discretion of the
          host and subject to the arrangements you make with them.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Cancellations by travelers</h2>
        <p className="text-charcoal-light leading-relaxed">
          If you cancel a confirmed stay, the Booking Protection Fee is not refunded. Contact your
          host promptly about any accommodation payment you have already made or scheduled.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Cancellations by hosts</h2>
        <p className="text-charcoal-light leading-relaxed">
          If a host cancels a confirmed stay, your Booking Protection Fee will be refunded. The host
          is responsible for resolving any accommodation payment with you directly.
        </p>

        <h2 className="text-xl font-semibold text-forest mt-8">Cancellations by {brand.name}</h2>
        <p className="text-charcoal-light leading-relaxed">
          If {brand.name} cancels a booking for safety, policy, or platform integrity reasons, your
          Booking Protection Fee will be refunded.
        </p>

        <p className="text-charcoal-light mt-8">
          See also our{" "}
          <Link href="/terms" className="text-forest underline">
            Terms of Service
          </Link>
          .
        </p>
      </Container>
    </Section>
  );
}
