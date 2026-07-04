"use client";

import { FormEvent, useEffect, useState } from "react";
import posthog from "posthog-js";
import { CreditCard, Lock } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { getStripeBrowserClient, getStripePublishableKey } from "@/lib/stripe-client";
import { defaultBillingCountryForCurrency, normalizeCurrencyCode } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ServiceFeeStripeCheckoutProps {
  stayRequestId: string;
  serviceFeeLabel: string;
  paymentCurrency?: string | null;
  defaultBillingCountry?: string | null;
  disabled: boolean;
  onCancel: () => void;
  onSuccess: (tripId: string | null) => void;
  onError: (message: string) => void;
  customerEmail?: string | null;
  customerName?: string | null;
}

function ServiceFeePaymentForm({
  stayRequestId,
  serviceFeeLabel,
  paymentCurrency,
  defaultBillingCountry,
  disabled,
  onCancel,
  onSuccess,
  onError,
  customerEmail,
  customerName,
}: ServiceFeeStripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [paymentMethodType, setPaymentMethodType] = useState<string>("card");

  const billingCountry =
    defaultBillingCountry ??
    defaultBillingCountryForCurrency(normalizeCurrencyCode(paymentCurrency ?? "USD"));

  const requiresPostalCode = paymentMethodType === "card";

  function buildBillingAddress(postalCode: string) {
    return {
      country: billingCountry,
      postal_code: postalCode,
      line1: "",
      line2: "",
      city: "",
      state: "",
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || disabled || isSubmitting) return;

    if (!customerEmail?.trim()) {
      onError("Your account email is required for payment. Update it in Settings and try again.");
      return;
    }

    const postalCode = billingPostalCode.trim();
    if (requiresPostalCode && !postalCode) {
      onError("ZIP / postal code is required.");
      return;
    }

    setIsSubmitting(true);
    onError("");

    const billingDetails = {
      email: customerEmail.trim(),
      name: customerName?.trim() || "Fore Beyond Guest",
      address: buildBillingAddress(requiresPostalCode ? postalCode : ""),
    };

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        payment_method_data: {
          billing_details: billingDetails,
        },
      },
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

    const tripId = typeof payload.tripId === "string" ? payload.tripId : null;
    posthog.capture("service_fee_paid", {
      stay_request_id: stayRequestId,
      trip_id: tripId ?? undefined,
    });
    onSuccess(tripId);
  }

  const canPay =
    !disabled &&
    paymentReady &&
    Boolean(stripe && elements) &&
    (!requiresPostalCode || billingPostalCode.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="rounded-xl border border-sage-dark/30 bg-sage/20 p-4 space-y-4">
        <div className="flex items-start gap-2 text-sm text-charcoal-light">
          <CreditCard className="h-5 w-5 text-forest shrink-0 mt-0.5" />
          <p>
            Pay {serviceFeeLabel} securely with Stripe
            {paymentCurrency ? ` (${paymentCurrency})` : ""}. Your card is charged only when you
            confirm this stay.
          </p>
        </div>

        <PaymentElement
          onReady={() => setPaymentReady(true)}
          onChange={(event) => {
            setPaymentMethodType(event.value.type);
          }}
          options={{
            layout: {
              type: "tabs",
              defaultCollapsed: false,
            },
            paymentMethodOrder: [
              "card",
              "apple_pay",
              "google_pay",
              "paypal",
              "affirm",
              "klarna",
              "cashapp",
              "amazon_pay",
            ],
            wallets: {
              applePay: "auto",
              googlePay: "auto",
              link: "never",
            },
            terms: {
              card: "never",
            },
            fields: {
              billingDetails: {
                email: "never",
                name: "never",
                address: "never",
              },
            },
          }}
        />

        {requiresPostalCode && (
          <Input
            id="billing-postal-code"
            label="ZIP / Postal code"
            value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
            autoComplete="postal-code"
            required
          />
        )}

        {customerEmail && (
          <p className="text-xs text-charcoal-light">
            Stripe receipt will be emailed to{" "}
            <span className="font-medium text-charcoal">{customerEmail}</span> after a successful
            payment.
          </p>
        )}

        <p className="flex items-center gap-1.5 text-xs text-charcoal-light">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Payments are processed by Stripe. Fore Beyond does not store your full card number.
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
                : requiresPostalCode && !billingPostalCode.trim()
                  ? "Enter your ZIP / postal code"
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
  const [paymentSessionId] = useState(() => crypto.randomUUID());
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<string | null>(null);
  const [defaultBillingCountry, setDefaultBillingCountry] = useState<string | null>(null);
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentSessionId }),
        }
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
      setCustomerEmail(typeof payload.customerEmail === "string" ? payload.customerEmail : null);
      setCustomerName(typeof payload.customerName === "string" ? payload.customerName : null);
      setPaymentCurrency(
        typeof payload.paymentCurrency === "string" ? payload.paymentCurrency : null
      );
      setDefaultBillingCountry(
        typeof payload.defaultBillingCountry === "string" ? payload.defaultBillingCountry : null
      );
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
  }, [props.stayRequestId, paymentSessionId]);

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
      <ServiceFeePaymentForm
        {...props}
        paymentCurrency={paymentCurrency ?? props.paymentCurrency}
        defaultBillingCountry={
          defaultBillingCountry ??
          props.defaultBillingCountry ??
          defaultBillingCountryForCurrency(
            normalizeCurrencyCode(paymentCurrency ?? props.paymentCurrency)
          )
        }
        customerEmail={customerEmail}
        customerName={customerName}
      />
    </Elements>
  );
}
