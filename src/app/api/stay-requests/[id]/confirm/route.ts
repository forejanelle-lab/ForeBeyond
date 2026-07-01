import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmStayByTraveler } from "@/lib/stay-approval";
import { getStripeServerClient, isStripeConfigured, STRIPE_CONFIG_MESSAGE } from "@/lib/stripe";
import { loadStayServiceFeeContext } from "@/lib/stay-service-fee-payment";

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
  const { data: context, error: contextError } = await loadStayServiceFeeContext(
    supabase,
    stayRequestId,
    user.id
  );

  if (contextError || !context) {
    return NextResponse.json({ error: contextError ?? "Unable to load stay request." }, { status: 400 });
  }

  const stripe = getStripeServerClient();
  let paymentIntent;

  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  if (paymentIntent.metadata.stay_request_id !== stayRequestId) {
    return NextResponse.json({ error: "Payment does not match this stay request." }, { status: 400 });
  }

  if (paymentIntent.metadata.traveler_id !== user.id) {
    return NextResponse.json({ error: "Payment does not match your account." }, { status: 403 });
  }

  if (paymentIntent.amount !== context.serviceFeeCents) {
    return NextResponse.json({ error: "Payment amount does not match the service fee." }, { status: 400 });
  }

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment has not completed yet. Please try again." },
      { status: 402 }
    );
  }

  const { error: confirmError, tripId } = await confirmStayByTraveler(
    supabase,
    context.request,
    context.pricing,
    { stripePaymentIntentId: paymentIntentId }
  );

  if (confirmError) {
    return NextResponse.json({ error: confirmError }, { status: 400 });
  }

  return NextResponse.json({ tripId });
}
