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
  const { data } = await supabase
    .from("stay_requests")
    .select("id")
    .eq("host_id", hostId)
    .eq("traveler_id", guestId)
    .limit(1)
    .maybeSingle();

  return !!data;
}

export function pickGuestNameRevealStatus(
  requests: Pick<StayRequest, "status">[]
): StayRequestStatus | null {
  if (requests.some((r) => isStayNameRevealed(r.status))) {
    return "approved";
  }
  return requests[0]?.status ?? null;
}
