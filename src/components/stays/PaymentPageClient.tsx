"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/stay-requests";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import type { StayBooking } from "@/types/database";

interface PaymentPageClientProps {
  tripId: string;
  booking: StayBooking;
  listingTitle: string | null;
}

export function PaymentPageClient({ tripId, booking, listingTitle }: PaymentPageClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paid, setPaid] = useState(booking.payment_status === "paid");
  const [error, setError] = useState("");

  async function handlePay() {
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("stay_bookings")
      .update({ payment_status: "paid" })
      .eq("id", booking.id)
      .eq("traveler_id", booking.traveler_id);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setPaid(true);
    setIsLoading(false);
    router.refresh();
  }

  if (paid) {
    return (
      <Container size="md" className="py-10 md:py-16">
        <Card variant="outline" padding="lg" className="text-center">
          <ShieldCheck className="h-12 w-12 text-forest mx-auto mb-4" />
          <Badge variant="success" className="mb-3">Payment confirmed</Badge>
          <h1 className="text-2xl font-bold text-forest">You&apos;re all set!</h1>
          <p className="text-charcoal-light mt-2">
            Your booking for {listingTitle ?? "this stay"} is confirmed.
          </p>
          <Link href={`/trips/${tripId}`} className="inline-block mt-6">
            <Button variant="primary" size="md">Back to trip</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link href={`/trips/${tripId}`} className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>

      <Badge variant="gold" className="mb-4">
        <CreditCard className="h-3 w-3" />
        Payment
      </Badge>
      <h1 className="text-3xl font-bold text-forest mb-2">Complete payment</h1>
      <p className="text-charcoal-light mb-8">
        Placeholder payment screen — no real charges will be made.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outline" padding="md" className="space-y-4">
          <h2 className="font-semibold text-forest">Booking summary</h2>
          <p className="text-sm text-charcoal-light">{listingTitle ?? "Stay booking"}</p>
          <div className="rounded-xl bg-sage/40 p-4">
            <p className="text-3xl font-bold text-forest">{formatCurrency(booking.total_amount)}</p>
            {booking.nightly_rate != null && (
              <p className="text-sm text-charcoal-light mt-1">
                {formatCurrency(booking.nightly_rate)} per night
              </p>
            )}
          </div>
        </Card>

        <Card variant="outline" padding="md" className="space-y-4">
          <h2 className="font-semibold text-forest flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Payment method
          </h2>
          <div className="rounded-xl border-2 border-dashed border-sage-dark p-6 text-center text-sm text-charcoal-light">
            Card entry placeholder
            <br />
            <span className="text-xs">Stripe integration coming soon</span>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}

          <Button variant="primary" size="lg" className="w-full" onClick={handlePay} isLoading={isLoading}>
            Pay {formatCurrency(booking.total_amount)}
          </Button>
          <p className="text-xs text-charcoal-light text-center">
            This is a demo. Clicking pay marks the booking as paid in your account.
          </p>
        </Card>
      </div>
    </Container>
  );
}
