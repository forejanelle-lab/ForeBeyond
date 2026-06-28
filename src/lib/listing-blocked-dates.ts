import type { SupabaseClient } from "@supabase/supabase-js";
import { dateRangesOverlap } from "@/lib/stay-availability";
import type { ListingBlockedDate } from "@/types/database";

export interface EditableBlockedDateRange {
  id?: string;
  start_date: string;
  end_date: string;
  note?: string | null;
}

export function validateEditableBlockedDateRanges(
  ranges: EditableBlockedDateRange[]
): string | null {
  for (const range of ranges) {
    if (!range.start_date || !range.end_date) {
      return "Each blocked-out range needs a start and end date.";
    }
    if (range.end_date <= range.start_date) {
      return "Blocked-out end date must be after the start date.";
    }
  }

  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      const a = ranges[i];
      const b = ranges[j];
      if (dateRangesOverlap(a.start_date, a.end_date, b.start_date, b.end_date)) {
        return "Blocked-out date ranges cannot overlap each other.";
      }
    }
  }

  return null;
}

export async function fetchListingBlockedDates(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingBlockedDate[]> {
  const { data, error } = await supabase
    .from("listing_blocked_dates")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ListingBlockedDate[]) ?? [];
}

export async function syncListingBlockedDates(
  supabase: SupabaseClient,
  listingId: string,
  ranges: EditableBlockedDateRange[]
): Promise<{ error: string | null }> {
  const validationError = validateEditableBlockedDateRanges(ranges);
  if (validationError) return { error: validationError };

  const { error: deleteError } = await supabase
    .from("listing_blocked_dates")
    .delete()
    .eq("listing_id", listingId);

  if (deleteError) return { error: deleteError.message };

  if (ranges.length === 0) return { error: null };

  const { error: insertError } = await supabase.from("listing_blocked_dates").insert(
    ranges.map((range) => ({
      listing_id: listingId,
      start_date: range.start_date,
      end_date: range.end_date,
      note: range.note?.trim() || null,
    }))
  );

  if (insertError) return { error: insertError.message };
  return { error: null };
}
