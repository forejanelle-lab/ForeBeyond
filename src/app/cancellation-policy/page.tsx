import Link from "next/link";
import { brand } from "@/lib/brand";
import { LegalPageShell } from "@/components/ui/LegalPageShell";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Cancellation Policy",
  description: "Fore Beyond cancellation policy, service fees, and refund terms.",
  path: "/cancellation-policy",
});

export default function CancellationPolicyPage() {
  return (
    <LegalPageShell title="Cancellation Policy">
      <section className="space-y-4">
        <h2>Service fee</h2>
        <p>
          {brand.name} collects a service fee when you confirm a stay. This fee is{" "}
          <strong>12% of your stay total</strong> — it is included in the listed price, not charged
          on top of it. For example, on a $100 stay you pay $12 to confirm and $88 directly to your
          host.
        </p>
        <p>
          Accommodation payment for the remaining balance is made directly between the traveler and
          the host.
        </p>
        <p>
          The Service Fee is <strong>non-refundable</strong> once payment has been completed. This
          fee covers identity verification, trust &amp; safety, secure messaging, booking management,
          customer support, and platform maintenance. These services begin immediately after payment.
        </p>
        <p>
          The Service Fee may be refunded only if {brand.name} cancels the booking.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Accommodation payment</h2>
        <p>
          The remaining balance after the service fee is coordinated directly between the traveler
          and the host. {brand.name} does not process host payouts. Any refund of accommodation costs
          is at the discretion of the host and subject to the arrangements you make with them.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Cancellations by travelers</h2>
        <p>
          If you cancel a confirmed stay, the Service Fee is not refunded. Contact your host promptly
          about any remaining balance you have already paid or scheduled.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Cancellations by hosts</h2>
        <p>
          If a host cancels a confirmed stay, the Service Fee is not refunded. The host is responsible
          for resolving any remaining accommodation payment with you directly.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Cancellations by {brand.name}</h2>
        <p>
          If {brand.name} cancels a booking for safety, policy, or platform integrity reasons, your
          Service Fee will be refunded.
        </p>
      </section>

      <p>
        See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPageShell>
  );
}
