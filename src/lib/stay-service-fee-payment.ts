import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { confirmStayByTraveler } from "@/lib/stay-approval";
import {
  calculateStayWithServiceFee,
  LISTING_PRICING_SELECT,
  pickListingPricing,
  type ListingPricing,
} from "@/lib/stay-requests";
import {
  amountToStripeMinorUnits,
  convertBetweenCurrencies,
  normalizeCurrencyCode,
  resolveListingPricingCurrency,
  roundMoneyForCurrency,
  type SupportedCurrencyCode,
} from "@/lib/currency";
import { getExchangeRates } from "@/lib/exchange-rates";
import type { StayRequest } from "@/types/database";

export interface StayServiceFeeContext {
  request: StayRequest;
  pricing: ListingPricing;
  paymentCurrency: SupportedCurrencyCode;
  serviceFeeInPaymentCurrency: number;
  serviceFeeMinorUnits: number;
}

export function buildServiceFeeIdempotencyKey(
  stayRequestId: string,
  serviceFeeMinorUnits: number,
  paymentCurrency: SupportedCurrencyCode,
  request: Pick<StayRequest, "start_date" | "end_date" | "guest_count">,
  paymentSessionId: string
) {
  return [
    "service-fee",
    stayRequestId,
    paymentCurrency,
    serviceFeeMinorUnits,
    request.start_date ?? "",
    request.end_date ?? "",
    request.guest_count ?? 1,
    paymentSessionId,
  ].join("-");
}

export async function loadStayServiceFeeContext(
  supabase: SupabaseClient,
  stayRequestId: string,
  travelerId: string
): Promise<{ data: StayServiceFeeContext | null; error: string | null }> {
  const [{ data: request, error: requestError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("stay_requests")
        .select("*")
        .eq("id", stayRequestId)
        .eq("traveler_id", travelerId)
        .maybeSingle(),
      supabase.from("profiles").select("default_currency").eq("id", travelerId).maybeSingle(),
    ]);

  if (requestError) {
    return { data: null, error: requestError.message };
  }

  if (profileError) {
    return { data: null, error: profileError.message };
  }

  if (!request) {
    return { data: null, error: "Stay request not found." };
  }

  if (request.status !== "host_approved") {
    return { data: null, error: "This stay is not ready for payment yet." };
  }

  if (!request.listing_id || !request.start_date || !request.end_date) {
    return { data: null, error: "Stay dates or listing are missing for this request." };
  }

  const { data: listing, error: listingError } = await supabase
    .from("host_listings")
    .select(`${LISTING_PRICING_SELECT}`)
    .eq("id", request.listing_id)
    .maybeSingle();

  if (listingError) {
    return { data: null, error: listingError.message };
  }

  if (!listing) {
    return { data: null, error: "Listing pricing is unavailable." };
  }

  const pricing = pickListingPricing(listing);
  const totals = calculateStayWithServiceFee(
    pricing,
    request.start_date,
    request.end_date,
    request.guest_count
  );

  if (!totals?.serviceFee || totals.serviceFee <= 0) {
    return { data: null, error: "Service fee could not be calculated for this stay." };
  }

  const hostCurrency = resolveListingPricingCurrency(listing);
  const paymentCurrency = normalizeCurrencyCode(profile?.default_currency);
  const { rates } = await getExchangeRates();
  const serviceFeeInPaymentCurrency = roundMoneyForCurrency(
    convertBetweenCurrencies(totals.serviceFee, hostCurrency, paymentCurrency, rates),
    paymentCurrency
  );
  const serviceFeeMinorUnits = amountToStripeMinorUnits(
    serviceFeeInPaymentCurrency,
    paymentCurrency
  );

  if (serviceFeeMinorUnits < 50) {
    return {
      data: null,
      error: "The service fee is below Stripe's minimum charge amount.",
    };
  }

  return {
    data: {
      request: request as StayRequest,
      pricing,
      paymentCurrency,
      serviceFeeInPaymentCurrency,
      serviceFeeMinorUnits,
    },
    error: null,
  };
}

export function verifyServiceFeePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  stayRequestId: string,
  travelerId: string,
  expectedMinorUnits: number,
  expectedCurrency: SupportedCurrencyCode
): string | null {
  if (paymentIntent.metadata.payment_type !== "service_fee") {
    return "Payment is not a stay service fee.";
  }

  if (paymentIntent.metadata.stay_request_id !== stayRequestId) {
    return "Payment does not match this stay request.";
  }

  if (paymentIntent.metadata.traveler_id !== travelerId) {
    return "Payment does not match the traveler.";
  }

  if (paymentIntent.currency.toLowerCase() !== expectedCurrency.toLowerCase()) {
    return "Payment currency does not match the service fee.";
  }

  if (paymentIntent.amount !== expectedMinorUnits) {
    return "Payment amount does not match the service fee.";
  }

  if (paymentIntent.status !== "succeeded") {
    return "Payment has not completed yet.";
  }

  return null;
}

export async function processServiceFeePaymentSuccess(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
  stayRequestId: string,
  travelerId: string
): Promise<{ error: string | null; tripId: string | null }> {
  const { data: context, error: contextError } = await loadStayServiceFeeContext(
    supabase,
    stayRequestId,
    travelerId
  );

  if (contextError || !context) {
    return { error: contextError ?? "Unable to load stay request.", tripId: null };
  }

  const verifyError = verifyServiceFeePaymentIntent(
    paymentIntent,
    stayRequestId,
    travelerId,
    context.serviceFeeMinorUnits,
    context.paymentCurrency
  );

  if (verifyError) {
    return { error: verifyError, tripId: null };
  }

  return confirmStayByTraveler(supabase, context.request, context.pricing, {
    stripePaymentIntentId: paymentIntent.id,
  });
}
