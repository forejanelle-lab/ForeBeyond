import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient, isStripeConfigured, STRIPE_CONFIG_MESSAGE } from "@/lib/stripe";
import { ensureStripeCustomer } from "@/lib/stripe-customer";
import { defaultBillingCountryForCurrency } from "@/lib/currency";
import {
  buildServiceFeeIdempotencyKey,
  loadStayServiceFeeContext,
  type StayServiceFeeContext,
} from "@/lib/stay-service-fee-payment";

function isIdempotencyKeyConflict(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes("idempotent");
}

function buildPaymentIntentParams(
  stayRequestId: string,
  userId: string,
  context: StayServiceFeeContext,
  customerId: string,
  email: string,
  name: string | null
): Stripe.PaymentIntentCreateParams {
  return {
    amount: context.serviceFeeMinorUnits,
    currency: context.paymentCurrency.toLowerCase(),
    customer: customerId,
    receipt_email: email,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "always",
    },
    metadata: {
      stay_request_id: stayRequestId,
      traveler_id: userId,
      host_id: context.request.host_id,
      listing_id: context.request.listing_id ?? "",
      payment_type: "service_fee",
      payment_currency: context.paymentCurrency,
      service_fee_minor_units: String(context.serviceFeeMinorUnits),
      traveler_email: email,
      traveler_name: name ?? "",
    },
    description: "Fore Beyond stay service fee",
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: STRIPE_CONFIG_MESSAGE }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentSessionId =
    typeof body.paymentSessionId === "string" && body.paymentSessionId.trim()
      ? body.paymentSessionId.trim()
      : crypto.randomUUID();

  const { id: stayRequestId } = await params;
  const { data: context, error: contextError } = await loadStayServiceFeeContext(
    supabase,
    stayRequestId,
    user.id
  );

  if (contextError || !context) {
    return NextResponse.json({ error: contextError ?? "Unable to load stay request." }, { status: 400 });
  }

  const stripe = getStripeServerClient();

  try {
    const { customerId, email, name } = await ensureStripeCustomer(
      stripe,
      supabase,
      user.id,
      user.email ?? ""
    );

    const paymentIntentParams = buildPaymentIntentParams(
      stayRequestId,
      user.id,
      context,
      customerId,
      email,
      name
    );

    const idempotencyKey = buildServiceFeeIdempotencyKey(
      stayRequestId,
      context.serviceFeeMinorUnits,
      context.paymentCurrency,
      context.request,
      paymentSessionId
    );

    let paymentIntent: Stripe.PaymentIntent;

    try {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });
    } catch (error) {
      if (!isIdempotencyKeyConflict(error)) {
        throw error;
      }

      const retryKey = buildServiceFeeIdempotencyKey(
        stayRequestId,
        context.serviceFeeMinorUnits,
        context.paymentCurrency,
        context.request,
        `${paymentSessionId}-retry-${Date.now()}`
      );
      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, {
        idempotencyKey: retryKey,
      });
    }

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Unable to start payment." }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountMinorUnits: context.serviceFeeMinorUnits,
      paymentCurrency: context.paymentCurrency,
      defaultBillingCountry: defaultBillingCountryForCurrency(context.paymentCurrency),
      customerEmail: email,
      customerName: name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
