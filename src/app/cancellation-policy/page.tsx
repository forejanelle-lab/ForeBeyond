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
        <h2>How {brand.name} supports hosts</h2>
        <p>
          {brand.name} is here to support hosts throughout the booking process. Accommodation
          payments are handled directly between the host and traveler. We do not process host
          payouts.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Service fee</h2>
        <p>
          {brand.name} collects a service fee when a traveler confirms a stay. This fee is 12% of
          the listed stay total and is charged on top of the host&apos;s listed rate. Hosts keep
          100% of their listed rate.
        </p>
        <p>
          For example, on a $100 listed stay the traveler pays $12 to {brand.name} to confirm and
          $100 directly to the host.
        </p>
        <p>
          The Service Fee is non-refundable once payment has been completed. This fee covers
          identity verification, trust &amp; safety, secure messaging, booking management, customer
          support, and platform maintenance. These services begin immediately after payment.
        </p>
        <p>
          The Service Fee may be refunded only if {brand.name} cancels the booking.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Accommodation payment</h2>
        <p>
          The listed stay amount is paid directly by the traveler to the host. {brand.name} does not
          process host payouts. Any deposit or remaining accommodation payment is arranged between
          the host and traveler.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Cancellations by travelers</h2>
        <p>
          If a traveler cancels a confirmed stay, the Service Fee is not refunded. Payments are
          coordinated between the traveler and host. Any deposits made beforehand are not
          refundable through {brand.name}.
        </p>
        <p>
          Travelers should contact their host promptly about any remaining balance they have already
          paid or scheduled.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Cancellations by hosts</h2>
        <p>
          If a host cancels a confirmed stay, the Service Fee is not refunded. The host is responsible
          for resolving any remaining accommodation payment with the traveler directly.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Cancellations by {brand.name}</h2>
        <p>
          If {brand.name} cancels a booking for safety, policy, or platform integrity reasons, the
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
