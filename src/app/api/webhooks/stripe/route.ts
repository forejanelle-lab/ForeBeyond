import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe";
import { processServiceFeePaymentSuccess } from "@/lib/stay-service-fee-payment";
import { createServiceClient } from "@/lib/supabase/service";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ ok: true } | { ok: false; retry: boolean; error: string }> {
  if (paymentIntent.metadata.payment_type !== "service_fee") {
    return { ok: true };
  }

  const stayRequestId = paymentIntent.metadata.stay_request_id?.trim();
  const travelerId = paymentIntent.metadata.traveler_id?.trim();

  if (!stayRequestId || !travelerId) {
    console.error("Stripe webhook: service fee payment missing metadata", paymentIntent.id);
    return { ok: false, retry: false, error: "Missing stay metadata on payment intent." };
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Service client unavailable.";
    return { ok: false, retry: true, error: message };
  }

  const { error, tripId } = await processServiceFeePaymentSuccess(
    supabase,
    paymentIntent,
    stayRequestId,
    travelerId
  );

  if (error) {
    console.error("Stripe webhook: failed to confirm stay", {
      paymentIntentId: paymentIntent.id,
      stayRequestId,
      error,
    });
    return { ok: false, retry: true, error };
  }

  if (tripId) {
    console.info("Stripe webhook: stay confirmed", { paymentIntentId: paymentIntent.id, tripId });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: travelerId,
    event: "stripe_service_fee_succeeded",
    properties: {
      stay_request_id: stayRequestId,
      trip_id: tripId ?? undefined,
      payment_intent_id: paymentIntent.id,
    },
  });

  return { ok: true };
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripeServerClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const result = await handlePaymentIntentSucceeded(event.data.object);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: result.retry ? 500 : 200 }
        );
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
