"use client";

import { FormEvent, useEffect, useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { getStripeBrowserClient, getStripePublishableKey } from "@/lib/stripe-client";
import { Button } from "@/components/ui/Button";

interface ServiceFeeStripeCheckoutProps {
  stayRequestId: string;
  serviceFeeLabel: string;
  disabled: boolean;
  onCancel: () => void;
  onSuccess: (tripId: string | null) => void;
  onError: (message: string) => void;
}

function ServiceFeePaymentForm({
  stayRequestId,
  serviceFeeLabel,
  disabled,
  onCancel,
  onSuccess,
  onError,
}: ServiceFeeStripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || disabled || isSubmitting) return;

    setIsSubmitting(true);
    onError("");

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      onError(confirmError.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const paymentIntentId = paymentIntent?.id;
    if (!paymentIntentId || paymentIntent.status !== "succeeded") {
      onError("Payment has not completed yet. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch(`/api/stay-requests/${stayRequestId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      onError(typeof payload.error === "string" ? payload.error : "Unable to confirm stay.");
      setIsSubmitting(false);
      return;
    }

    onSuccess(typeof payload.tripId === "string" ? payload.tripId : null);
  }

  const canPay = !disabled && paymentReady && Boolean(stripe && elements);

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="rounded-xl border border-sage-dark/30 bg-sage/20 p-4 space-y-4">
        <div className="flex items-start gap-2 text-sm text-charcoal-light">
          <CreditCard className="h-5 w-5 text-forest shrink-0 mt-0.5" />
          <p>
            Pay {serviceFeeLabel} securely with Stripe. Your card is charged only when you confirm
            this stay.
          </p>
        </div>

        <PaymentElement
          onReady={() => setPaymentReady(true)}
          options={{
            layout: "tabs",
          }}
        />

        <p className="flex items-center gap-1.5 text-xs text-charcoal-light">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Card details are processed by Stripe. Fore Beyond does not store your full card number.
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-sage-dark/20 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Go back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="flex-1 justify-center"
          isLoading={isSubmitting}
          disabled={!canPay}
          title={
            disabled
              ? "Please acknowledge all items before paying"
              : !paymentReady
                ? "Loading payment form…"
                : undefined
          }
        >
          Pay Service Fee
        </Button>
      </div>
    </form>
  );
}

export function ServiceFeeStripeCheckout(props: ServiceFeeStripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(true);

  useEffect(() => {
    if (!getStripePublishableKey()) {
      setIntentError(
        "Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments."
      );
      setLoadingIntent(false);
      return;
    }

    let cancelled = false;

    async function loadPaymentIntent() {
      setLoadingIntent(true);
      setIntentError("");

      const response = await fetch(
        `/api/stay-requests/${props.stayRequestId}/service-fee-payment-intent`,
        { method: "POST" }
      );
      const payload = await response.json().catch(() => ({}));

      if (cancelled) return;

      if (!response.ok) {
        setIntentError(
          typeof payload.error === "string"
            ? payload.error
            : "Unable to start payment. Please try again."
        );
        setLoadingIntent(false);
        return;
      }

      if (typeof payload.clientSecret !== "string") {
        setIntentError("Unable to start payment. Please try again.");
        setLoadingIntent(false);
        return;
      }

      setClientSecret(payload.clientSecret);
      setLoadingIntent(false);
    }

    loadPaymentIntent().catch(() => {
      if (cancelled) return;
      setIntentError("Unable to start payment. Please try again.");
      setLoadingIntent(false);
    });

    return () => {
      cancelled = true;
    };
  }, [props.stayRequestId]);

  if (loadingIntent) {
    return (
      <div className="mt-5 rounded-xl border border-sage-dark/30 bg-sage/20 p-4 text-sm text-charcoal-light">
        Preparing secure payment…
      </div>
    );
  }

  if (intentError || !clientSecret) {
    return (
      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {intentError || "Unable to start payment. Please try again."}
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripeBrowserClient()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2d5016",
            colorText: "#1a1a1a",
            borderRadius: "12px",
          },
        },
      }}
    >
      <ServiceFeePaymentForm {...props} />
    </Elements>
  );
}
