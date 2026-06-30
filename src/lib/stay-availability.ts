import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateRange } from "@/lib/stay-requests";

export type BlockedDateSource = "confirmed_stay" | "host_unavailable";

export interface BlockedDateRange {
  start_date: string;
  end_date: string;
  source?: BlockedDateSource;
}

export function dateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

export function findStayDateConflict(
  startDate: string,
  endDate: string,
  blockedRanges: BlockedDateRange[]
): BlockedDateRange | null {
  for (const range of blockedRanges) {
    if (dateRangesOverlap(startDate, endDate, range.start_date, range.end_date)) {
      return range;
    }
  }
  return null;
}

/** A night is blocked when it falls in [start_date, end_date). */
export function isBlockedNight(dateIso: string, blockedRanges: BlockedDateRange[]): boolean {
  return blockedRanges.some(
    (range) => dateIso >= range.start_date && dateIso < range.end_date
  );
}

export function isStayCheckInDisabled(
  dateIso: string,
  minDate: string,
  blockedRanges: BlockedDateRange[]
): boolean {
  return dateIso < minDate || isBlockedNight(dateIso, blockedRanges);
}

export function isStayCheckOutDisabled(
  dateIso: string,
  checkIn: string,
  blockedRanges: BlockedDateRange[]
): boolean {
  if (!checkIn || dateIso <= checkIn) return true;
  return Boolean(findStayDateConflict(checkIn, dateIso, blockedRanges));
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthStartIso(year: number, month: number): string {
  return toIsoDate(year, month, 1);
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function getStayDateConflictMessage(conflict: BlockedDateRange): string {
  const range = formatDateRange(conflict.start_date, conflict.end_date);
  if (conflict.source === "host_unavailable") {
    return `These dates overlap with dates the host is unavailable (${range}). Please choose different dates.`;
  }
  return `These dates overlap with a confirmed stay (${range}). Please choose different dates.`;
}

export function getHostApproveConflictMessage(conflict: BlockedDateRange): string {
  const range = formatDateRange(conflict.start_date, conflict.end_date);
  if (conflict.source === "host_unavailable") {
    return `You cannot approve this request — the dates overlap with blocked-out dates on your listing (${range}).`;
  }
  return `You cannot approve this request — the dates overlap with a confirmed stay (${range}).`;
}

export async function getApprovedStayBlockedDates(
  supabase: SupabaseClient,
  listingId: string,
  excludeRequestId?: string
): Promise<BlockedDateRange[]> {
  const { data } = await supabase
    .from("stay_requests")
    .select("id, start_date, end_date")
    .eq("listing_id", listingId)
    .eq("status", "approved")
    .not("start_date", "is", null)
    .not("end_date", "is", null);

  return (data ?? [])
    .filter((row) => !excludeRequestId || row.id !== excludeRequestId)
    .map((row) => ({
      start_date: row.start_date as string,
      end_date: row.end_date as string,
      source: "confirmed_stay" as const,
    }));
}

export async function getListingHostBlockedDates(
  supabase: SupabaseClient,
  listingId: string
): Promise<BlockedDateRange[]> {
  const { data } = await supabase
    .from("listing_blocked_dates")
    .select("start_date, end_date")
    .eq("listing_id", listingId)
    .order("start_date", { ascending: true });

  return (data ?? []).map((row) => ({
    start_date: row.start_date as string,
    end_date: row.end_date as string,
    source: "host_unavailable" as const,
  }));
}

export async function getStayBlockedDates(
  supabase: SupabaseClient,
  listingId: string,
  excludeRequestId?: string
): Promise<BlockedDateRange[]> {
  const [confirmedStays, hostBlocked] = await Promise.all([
    getApprovedStayBlockedDates(supabase, listingId, excludeRequestId),
    getListingHostBlockedDates(supabase, listingId),
  ]);

  return [...hostBlocked, ...confirmedStays];
}
