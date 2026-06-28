import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureStayConversation } from "@/lib/messaging";
import {
  findStayDateConflict,
  getHostApproveConflictMessage,
  getStayBlockedDates,
} from "@/lib/stay-availability";
import {
  calculateEffectiveNightlyTotal,
  calculateStayTotal,
  type ListingPricing,
} from "@/lib/stay-requests";
import type { StayRequest } from "@/types/database";

async function assertNoApprovedStayConflict(
  supabase: SupabaseClient,
  request: Pick<StayRequest, "id" | "listing_id" | "start_date" | "end_date">
): Promise<string | null> {
  if (!request.listing_id || !request.start_date || !request.end_date) return null;

  const blockedRanges = await getStayBlockedDates(
    supabase,
    request.listing_id,
    request.id
  );
  const conflict = findStayDateConflict(
    request.start_date,
    request.end_date,
    blockedRanges
  );

  return conflict ? getHostApproveConflictMessage(conflict) : null;
}

/** Host approves — traveler must confirm before trip/booking is created */
export async function approveStayRequest(
  supabase: SupabaseClient,
  request: StayRequest,
  hostResponse?: string | null
) {
  const conflictError = await assertNoApprovedStayConflict(supabase, request);
  if (conflictError) return { error: conflictError, tripId: null };

  const { error: updateError } = await supabase
    .from("stay_requests")
    .update({
      status: "host_approved",
      host_response: hostResponse?.trim() || request.host_response,
    })
    .eq("id", request.id)
    .eq("host_id", request.host_id);

  if (updateError) return { error: updateError.message, tripId: null };

  await ensureStayConversation(supabase, request.id);

  return { error: null, tripId: null };
}

/** Traveler confirms after host approval — creates trip and booking */
export async function confirmStayByTraveler(
  supabase: SupabaseClient,
  request: StayRequest,
  pricing: ListingPricing
) {
  const conflictError = await assertNoApprovedStayConflict(supabase, request);
  if (conflictError) return { error: conflictError, tripId: null };

  const { error: updateError } = await supabase
    .from("stay_requests")
    .update({ status: "approved" })
    .eq("id", request.id)
    .eq("traveler_id", request.traveler_id)
    .eq("status", "host_approved");

  if (updateError) return { error: updateError.message, tripId: null };

  const totalAmount =
    request.start_date && request.end_date
      ? calculateStayTotal(pricing, request.start_date, request.end_date, request.guest_count)
      : null;

  const nightlyRate = calculateEffectiveNightlyTotal(pricing, request.guest_count);

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      stay_request_id: request.id,
      traveler_id: request.traveler_id,
      host_id: request.host_id,
      listing_id: request.listing_id,
      start_date: request.start_date,
      end_date: request.end_date,
      status: "upcoming",
    })
    .select("id")
    .single();

  if (tripError) return { error: tripError.message, tripId: null };

  const { error: bookingError } = await supabase.from("stay_bookings").insert({
    stay_request_id: request.id,
    trip_id: trip.id,
    listing_id: request.listing_id,
    traveler_id: request.traveler_id,
    host_id: request.host_id,
    start_date: request.start_date,
    end_date: request.end_date,
    guest_count: request.guest_count,
    nightly_rate: nightlyRate,
    total_amount: totalAmount,
    payment_status: "paid",
  });

  if (bookingError) return { error: bookingError.message, tripId: trip.id };

  return { error: null, tripId: trip.id };
}

export async function declineStayRequest(
  supabase: SupabaseClient,
  requestId: string,
  hostId: string,
  hostResponse?: string | null
) {
  const { error } = await supabase
    .from("stay_requests")
    .update({
      status: "rejected",
      host_response: hostResponse?.trim() || null,
    })
    .eq("id", requestId)
    .eq("host_id", hostId);

  return { error: error?.message ?? null };
}

export async function revertStayRequest(
  supabase: SupabaseClient,
  requestId: string,
  hostId: string
) {
  const { error } = await supabase
    .from("stay_requests")
    .update({
      status: "pending",
      host_response: null,
    })
    .eq("id", requestId)
    .eq("host_id", hostId)
    .eq("status", "rejected");

  return { error: error?.message ?? null };
}

export async function respondToStayRequest(
  supabase: SupabaseClient,
  requestId: string,
  hostId: string,
  hostResponse: string
) {
  const { error } = await supabase
    .from("stay_requests")
    .update({ host_response: hostResponse.trim() })
    .eq("id", requestId)
    .eq("host_id", hostId);

  return { error: error?.message ?? null };
}

export async function withdrawApprovedStay(
  supabase: SupabaseClient,
  requestId: string,
  hostId: string,
  reason: string
) {
  void hostId;
  const { error } = await supabase.rpc("withdraw_approved_stay", {
    p_stay_request_id: requestId,
    p_reason: reason,
  });

  if (error) return { error: error.message };
  return { error: null };
}
