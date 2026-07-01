import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient, isStripeConfigured, STRIPE_CONFIG_MESSAGE } from "@/lib/stripe";
import { loadStayServiceFeeContext } from "@/lib/stay-service-fee-payment";

export async function POST(
  _request: Request,
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
    const paymentIntent = await stripe.paymentIntents.create({
    amount: context.serviceFeeCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      stay_request_id: stayRequestId,
      traveler_id: user.id,
      host_id: context.request.host_id,
      listing_id: context.request.listing_id ?? "",
      payment_type: "service_fee",
    },
    description: "Fore Beyond stay service fee",
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Unable to start payment." }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountCents: context.serviceFeeCents,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
