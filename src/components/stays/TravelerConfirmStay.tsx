"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, X } from "lucide-react";
import {
  calculateStayWithServiceFee,
  getConfirmStayDisabledReason,
  type ListingPricing,
} from "@/lib/stay-requests";
import { StayTravelerPricingBreakdown } from "@/components/stays/StayTravelerPricingBreakdown";
import { ServiceFeeStripeCheckout } from "@/components/stays/ServiceFeeStripePaymentForm";
import { useCurrency } from "@/components/i18n/CurrencyProvider";
import { resolveListingPricingCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { StayRequest } from "@/types/database";

interface TravelerConfirmStayProps {
  request: StayRequest;
  listingPricing: ListingPricing;
  hostName: string;
  hostCountry?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
}

const INITIAL_ACKNOWLEDGMENTS = {
  accommodationDirect: false,
  bookingProtectionNonRefundable: false,
  cancellationPolicy: false,
  termsOfService: false,
} as const;

type AcknowledgmentKey = keyof typeof INITIAL_ACKNOWLEDGMENTS;

const SERVICE_FEE_COVERAGE = [
  "Identity Verification",
  "Trust & Safety",
  "Secure Messaging",
  "Booking Management",
  "Customer Support",
  "Platform Maintenance",
] as const;

export function TravelerConfirmStay({
  request,
  listingPricing,
  hostName,
  hostCountry,
  customerEmail,
  customerName,
}: TravelerConfirmStayProps) {
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const sourceCurrency = resolveListingPricingCurrency(listingPricing);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalStep, setModalStep] = useState<"terms" | "payment">("terms");
  const [acknowledgments, setAcknowledgments] = useState({ ...INITIAL_ACKNOWLEDGMENTS });

  const allAcknowledged = Object.values(acknowledgments).every(Boolean);

  function closeConfirmModal() {
    setShowConfirmModal(false);
    setModalStep("terms");
    setAcknowledgments({ ...INITIAL_ACKNOWLEDGMENTS });
    setError("");
  }

  function toggleAcknowledgment(key: AcknowledgmentKey) {
    setAcknowledgments((current) => ({ ...current, [key]: !current[key] }));
  }

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

  function handlePaymentSuccess(tripId: string | null) {
    setConfirmed(true);
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
            Review the details, then pay the service fee via Stripe to confirm. The remaining balance
            is paid directly to your host.
          </p>
        </div>

        {pricing && (
          <StayTravelerPricingBreakdown
            nightlyRateUsd={pricing.effectiveNightlyTotal}
            nights={pricing.nights}
            guestCount={pricing.guestCount}
            subtotal={pricing.subtotal}
            serviceFee={pricing.serviceFee}
            hostBalance={pricing.hostBalance}
            listingPricing={listingPricing}
            hostCountry={hostCountry}
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
            onClick={closeConfirmModal}
            aria-label="Close confirmation dialog"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-stay-title"
            className="relative flex w-full max-w-lg max-h-[90vh] flex-col rounded-2xl bg-white shadow-xl border border-sage-dark/30"
          >
            <div className="overflow-y-auto p-6">
              <button
                type="button"
                onClick={closeConfirmModal}
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
                    {modalStep === "terms" ? "Confirm your stay" : "Pay service fee"}
                  </h2>
                  <p className="text-sm text-charcoal-light mt-2 leading-relaxed">
                    {modalStep === "terms" ? (
                      <>
                        Your stay total is {formatAmount(pricing.subtotal, sourceCurrency)}. Pay{" "}
                        {formatAmount(pricing.serviceFee, sourceCurrency)} now (12% service fee) to
                        confirm. The remaining{" "}
                        {formatAmount(pricing.hostBalance, sourceCurrency)} is paid directly to{" "}
                        {hostName}.
                      </>
                    ) : (
                      <>
                        Pay {formatAmount(pricing.serviceFee, sourceCurrency)} securely with Stripe
                        to confirm your booking with {hostName}.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {modalStep === "terms" ? (
                <>
                  <div className="rounded-xl bg-sage/30 p-4 text-sm text-charcoal-light space-y-3">
                    <p>
                      The Service Fee is <strong className="text-forest">NON-REFUNDABLE</strong> once
                      payment has been completed.
                    </p>
                    <div>
                      <p className="font-medium text-forest mb-1.5">This fee covers:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {SERVICE_FEE_COVERAGE.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <fieldset className="mt-5 space-y-3">
                    <legend className="text-sm font-medium text-forest mb-1">
                      Please acknowledge before continuing
                    </legend>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgments.accommodationDirect}
                        onChange={() => toggleAcknowledgment("accommodationDirect")}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-sage-dark text-forest focus:ring-forest"
                      />
                      <span className="text-sm text-charcoal-light">
                        I understand the remaining balance (
                        {formatAmount(pricing.hostBalance, sourceCurrency)}) is paid directly to the
                        host.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgments.bookingProtectionNonRefundable}
                        onChange={() => toggleAcknowledgment("bookingProtectionNonRefundable")}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-sage-dark text-forest focus:ring-forest"
                      />
                      <span className="text-sm text-charcoal-light">
                        I understand the Fore Beyond Service Fee is non-refundable once paid, except if
                        Fore Beyond cancels the booking.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgments.cancellationPolicy}
                        onChange={() => toggleAcknowledgment("cancellationPolicy")}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-sage-dark text-forest focus:ring-forest"
                      />
                      <span className="text-sm text-charcoal-light">
                        I have read and agree to the{" "}
                        <Link
                          href="/cancellation-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forest underline"
                        >
                          Cancellation Policy
                        </Link>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgments.termsOfService}
                        onChange={() => toggleAcknowledgment("termsOfService")}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-sage-dark text-forest focus:ring-forest"
                      />
                      <span className="text-sm text-charcoal-light">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forest underline"
                        >
                          Terms of Service
                        </Link>
                        .
                      </span>
                    </label>
                  </fieldset>

                  {error && (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
                  )}

                  <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 border-t border-sage-dark/20 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      className="flex-1"
                      onClick={closeConfirmModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="flex-1 justify-center"
                      onClick={() => {
                        setError("");
                        setModalStep("payment");
                      }}
                      disabled={!allAcknowledged}
                      title={!allAcknowledged ? "Please acknowledge all items to continue" : undefined}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {error && (
                    <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
                  )}

                  <ServiceFeeStripeCheckout
                    stayRequestId={request.id}
                    serviceFeeLabel={formatAmount(pricing.serviceFee, sourceCurrency)}
                    disabled={false}
                    onCancel={() => {
                      setError("");
                      setModalStep("terms");
                    }}
                    onSuccess={handlePaymentSuccess}
                    onError={setError}
                    customerEmail={customerEmail}
                    customerName={customerName}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
