import type { SupabaseClient } from "@supabase/supabase-js";
import type { StayRequest, StayRequestStatus } from "@/types/database";
import { isStayNameRevealed } from "@/lib/member-display-name";

export function guestProfilePath(guestId: string, stayRequestId?: string | null) {
  const base = `/host/guests/${guestId}`;
  if (!stayRequestId) return base;
  return `${base}?request=${stayRequestId}`;
}

export async function hostHasGuestRequest(
  supabase: SupabaseClient,
  hostId: string,
  guestId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("host_has_stay_request_with_traveler", {
    p_host_id: hostId,
    p_traveler_id: guestId,
  });

  if (error) {
    console.error("hostHasGuestRequest failed:", error.message);
    return false;
  }

  return data === true;
}

export function pickGuestNameRevealStatus(
  requests: Pick<StayRequest, "status">[]
): StayRequestStatus | null {
  if (requests.some((r) => isStayNameRevealed(r.status))) {
    return "approved";
  }
  return requests[0]?.status ?? null;
}
