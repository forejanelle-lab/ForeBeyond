import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient, isStripeConfigured, STRIPE_CONFIG_MESSAGE } from "@/lib/stripe";
import { processServiceFeePaymentSuccess } from "@/lib/stay-service-fee-payment";
import { getPostHogClient } from "@/lib/posthog-server";

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
  const paymentIntentId =
    typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";

  if (!paymentIntentId) {
    return NextResponse.json({ error: "Payment intent is required." }, { status: 400 });
  }

  const { id: stayRequestId } = await params;
  const stripe = getStripeServerClient();
  let paymentIntent;

  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const { error, tripId } = await processServiceFeePaymentSuccess(
    supabase,
    paymentIntent,
    stayRequestId,
    user.id
  );

  if (error) {
    const status =
      error === "Payment has not completed yet."
        ? 402
        : error === "Payment does not match the traveler."
          ? 403
          : 400;
    return NextResponse.json({ error }, { status });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "stay_confirmed",
    properties: {
      stay_request_id: stayRequestId,
      trip_id: tripId ?? undefined,
    },
  });

  return NextResponse.json({ tripId });
}
