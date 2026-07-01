import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateStayWithServiceFee,
  LISTING_PRICING_SELECT,
  pickListingPricing,
  type ListingPricing,
} from "@/lib/stay-requests";
import { dollarsToStripeCents } from "@/lib/stripe";
import type { StayRequest } from "@/types/database";

export interface StayServiceFeeContext {
  request: StayRequest;
  pricing: ListingPricing;
  serviceFeeDollars: number;
  serviceFeeCents: number;
}

export async function loadStayServiceFeeContext(
  supabase: SupabaseClient,
  stayRequestId: string,
  travelerId: string
): Promise<{ data: StayServiceFeeContext | null; error: string | null }> {
  const { data: request, error: requestError } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("id", stayRequestId)
    .eq("traveler_id", travelerId)
    .maybeSingle();

  if (requestError) {
    return { data: null, error: requestError.message };
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
    .select(LISTING_PRICING_SELECT)
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

  const serviceFeeCents = dollarsToStripeCents(totals.serviceFee);
  if (serviceFeeCents < 50) {
    return {
      data: null,
      error: "The service fee is below Stripe's minimum charge amount.",
    };
  }

  return {
    data: {
      request: request as StayRequest,
      pricing,
      serviceFeeDollars: totals.serviceFee,
      serviceFeeCents,
    },
    error: null,
  };
}
