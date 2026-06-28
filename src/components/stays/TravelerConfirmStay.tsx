"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { confirmStayByTraveler } from "@/lib/stay-approval";
import {
  calculateStayWithServiceFee,
  formatCurrency,
  getConfirmStayDisabledReason,
  type ListingPricing,
} from "@/lib/stay-requests";
import { StayTravelerPricingBreakdown } from "@/components/stays/StayTravelerPricingBreakdown";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { StayRequest } from "@/types/database";

interface TravelerConfirmStayProps {
  request: StayRequest;
  listingPricing: ListingPricing;
  hostName: string;
}

export function TravelerConfirmStay({ request, listingPricing, hostName }: TravelerConfirmStayProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const pricing =
    request.start_date && request.end_date
      ? calculateStayWithServiceFee(
          listingPricing,
          request.start_date,
          request.end_date,
          request.guest_count
        )
      : null;

  const disabledReason = getConfirmStayDisabledReason(request, listingPricing);
  const canConfirm = !disabledReason;

  async function handleConfirm() {
    setError("");
    setIsLoading(true);
    const supabase = createClient();
    const { error: confirmError, tripId } = await confirmStayByTraveler(
      supabase,
      request,
      listingPricing
    );
    if (confirmError) {
      setError(confirmError);
      setIsLoading(false);
      setShowConfirmModal(false);
      return;
    }
    setConfirmed(true);
    setIsLoading(false);
    setShowConfirmModal(false);
    if (tripId) router.push(`/trips/${tripId}`);
    else router.refresh();
  }

  if (confirmed) {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-forest font-medium text-center">Stay confirmed! Redirecting…</p>
      </Card>
    );
  }

  return (
    <>
      <Card variant="outline" padding="md" className="space-y-4">
        <div>
          <p className="font-medium text-forest">{hostName} approved your stay</p>
          <p className="text-sm text-charcoal-light mt-1">
            Review the details, then confirm to finalize your booking.
          </p>
        </div>

        {pricing && (
          <StayTravelerPricingBreakdown
            rateLabel={pricing.rateLabel}
            nights={pricing.nights}
            guestCount={pricing.guestCount}
            subtotal={pricing.subtotal}
            serviceFee={pricing.serviceFee}
            footerNote="Stay payment is coordinated directly with your host."
          />
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="relative group">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center gap-2 whitespace-normal text-center leading-snug min-h-[2.75rem] px-4"
            onClick={() => setShowConfirmModal(true)}
            disabled={!canConfirm}
            title={disabledReason ?? undefined}
          >
            <Check className="h-4 w-4 shrink-0" />
            Confirm stay
          </Button>
          {!canConfirm && disabledReason && (
            <div
              role="tooltip"
              className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-64 -translate-x-1/2 rounded-xl border border-sage-dark/30 bg-white px-3 py-2 text-xs text-charcoal-light shadow-lg opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
            >
              {disabledReason}
            </div>
          )}
        </div>
      </Card>

      {showConfirmModal && pricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => !isLoading && setShowConfirmModal(false)}
            aria-label="Close confirmation dialog"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-stay-title"
            className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-6"
          >
            <button
              type="button"
              onClick={() => !isLoading && setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-charcoal-light hover:text-forest"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3 mb-4 pr-8">
              <div className="rounded-full bg-sage/60 p-2 text-forest shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 id="confirm-stay-title" className="text-lg font-semibold text-forest">
                  Confirm your stay
                </h2>
                <p className="text-sm text-charcoal-light mt-2 leading-relaxed">
                  The service fee ({formatCurrency(pricing.serviceFee)}) is charged when you
                  confirm. You must coordinate the remaining stay payment (
                  {formatCurrency(pricing.subtotal)}) directly with {hostName} — Fore Beyond does
                  not process the host payout.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
              >
                Go back
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 justify-center"
                onClick={handleConfirm}
                isLoading={isLoading}
              >
                Pay Service Fee
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
