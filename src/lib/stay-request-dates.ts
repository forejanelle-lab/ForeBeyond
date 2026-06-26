import type { SupabaseClient } from "@supabase/supabase-js";
import type { StayRequest } from "@/types/database";
import { todayIso } from "@/lib/messaging";

export function canTravelerModifyStayDates(status: StayRequest["status"]) {
  return status === "pending" || status === "host_approved";
}

export function validateStayDateRange(startDate: string, endDate: string): string | null {
  const minDate = todayIso();
  if (!startDate || !endDate) return "Please select check-in and check-out dates.";
  if (startDate < minDate) return "Check-in cannot be in the past.";
  if (endDate < minDate) return "Check-out cannot be in the past.";
  if (endDate <= startDate) return "Check-out must be after check-in.";
  return null;
}

/** Traveler updates dates — resets request to pending for host re-approval */
export async function updateStayRequestDatesByTraveler(
  supabase: SupabaseClient,
  request: StayRequest,
  startDate: string,
  endDate: string
) {
  if (!canTravelerModifyStayDates(request.status)) {
    return { error: "These dates can no longer be changed." };
  }

  const dateError = validateStayDateRange(startDate, endDate);
  if (dateError) return { error: dateError };

  const unchanged =
    request.start_date === startDate && request.end_date === endDate;
  if (unchanged) {
    return { error: "Choose different dates to update your request." };
  }

  const { error } = await supabase
    .from("stay_requests")
    .update({
      start_date: startDate,
      end_date: endDate,
      status: "pending",
      host_response: null,
    })
    .eq("id", request.id)
    .eq("traveler_id", request.traveler_id)
    .in("status", ["pending", "host_approved"]);

  if (error) return { error: error.message };
  return { error: null };
}
