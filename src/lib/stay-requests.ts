import type { BookingPaymentStatus, StayRequestStatus } from "@/types/database";

export const SERVICE_FEE_RATE = 0.12;

export interface ListingPricing {
  budget_per_night: number | null;
  budget_per_night_3_guests: number | null;
  budget_per_night_4_guests: number | null;
  budget_per_night_5_guests: number | null;
  budget_per_night_6_plus_guests: number | null;
  pricing_currency?: string | null;
  country?: string | null;
}

export const LISTING_PRICING_SELECT =
  "budget_per_night, budget_per_night_3_guests, budget_per_night_4_guests, budget_per_night_5_guests, budget_per_night_6_plus_guests, pricing_currency, country";

export function pickListingPricing(
  listing: Partial<ListingPricing> & { country?: string | null; pricing_currency?: string | null }
): ListingPricing {
  return {
    budget_per_night: listing.budget_per_night ?? null,
    budget_per_night_3_guests: listing.budget_per_night_3_guests ?? null,
    budget_per_night_4_guests: listing.budget_per_night_4_guests ?? null,
    budget_per_night_5_guests: listing.budget_per_night_5_guests ?? null,
    budget_per_night_6_plus_guests: listing.budget_per_night_6_plus_guests ?? null,
    pricing_currency: listing.pricing_currency ?? null,
    country: listing.country ?? null,
  };
}

export type GuestPricingTier = "standard" | "3" | "4" | "5" | "6_plus";

export function resolveGuestPricingTier(guestCount: number): GuestPricingTier {
  const guests = Math.max(guestCount, 1);
  if (guests <= 2) return "standard";
  if (guests === 3) return "3";
  if (guests === 4) return "4";
  if (guests === 5) return "5";
  return "6_plus";
}

function tierNightlyRate(pricing: ListingPricing, tier: GuestPricingTier): number | null {
  switch (tier) {
    case "standard":
      return pricing.budget_per_night;
    case "3":
      return pricing.budget_per_night_3_guests;
    case "4":
      return pricing.budget_per_night_4_guests;
    case "5":
      return pricing.budget_per_night_5_guests;
    case "6_plus":
      return pricing.budget_per_night_6_plus_guests;
  }
}

export function hasPricingForGuestCount(pricing: ListingPricing, guestCount: number): boolean {
  const tier = resolveGuestPricingTier(guestCount);
  return tierNightlyRate(pricing, tier) != null;
}

/** Flat nightly rate for the guest-count tier (same rate for 1 or 2 guests) */
export function calculateEffectiveNightlyTotal(
  pricing: ListingPricing,
  guestCount: number
): number | null {
  const tier = resolveGuestPricingTier(guestCount);
  return tierNightlyRate(pricing, tier);
}

export function formatStayRateLabel(pricing: ListingPricing, guestCount: number): string {
  const tier = resolveGuestPricingTier(guestCount);
  const rate = tierNightlyRate(pricing, tier);
  if (rate == null) return "Rate on request";
  return `${formatCurrency(rate)}/night`;
}

/** @deprecated Use formatStayRateLabel with ListingPricing */
export function formatListingNightlyRate(nightlyRate: number | null | undefined) {
  if (nightlyRate == null) return "Rate on request";
  return `${formatCurrency(nightlyRate)}/night`;
}

export const STAY_REQUEST_STATUS_LABELS: Record<
  StayRequestStatus,
  { label: string; variant: "outline" | "success" | "warning" | "default" }
> = {
  pending: { label: "Pending", variant: "warning" },
  host_approved: { label: "Awaiting traveler", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Declined", variant: "default" },
  cancelled: { label: "Cancelled", variant: "outline" },
  completed: { label: "Completed", variant: "success" },
};

export const TRIP_STATUS_LABELS: Record<
  string,
  { label: string; variant: "outline" | "success" | "warning" | "default" | "gold" }
> = {
  upcoming: { label: "Upcoming", variant: "gold" },
  active: { label: "Active", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export const PAYMENT_STATUS_LABELS: Record<
  BookingPaymentStatus,
  { label: string; variant: "outline" | "success" | "warning" | "default" }
> = {
  pending: { label: "Host payment pending", variant: "warning" },
  paid: { label: "Paid to host", variant: "success" },
  failed: { label: "Payment Failed", variant: "default" },
  refunded: { label: "Refunded", variant: "outline" },
};

export function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return "Dates not set";
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

export function formatBookingReference(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function calculateNights(startDate: string, endDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

export function calculateStayTotal(
  pricing: ListingPricing,
  startDate: string,
  endDate: string,
  guestCount = 1
) {
  const nightlyTotal = calculateEffectiveNightlyTotal(pricing, guestCount);
  if (nightlyTotal == null) return null;
  const nights = calculateNights(startDate, endDate);
  return Math.round(nightlyTotal * nights * 100) / 100;
}

export function calculateServiceFee(staySubtotal: number | null) {
  if (staySubtotal == null) return null;
  return Math.round(staySubtotal * SERVICE_FEE_RATE * 100) / 100;
}

/** Amount the guest pays the host after the service fee is paid at confirmation */
export function calculateHostBalance(staySubtotal: number | null) {
  if (staySubtotal == null) return null;
  const serviceFee = calculateServiceFee(staySubtotal) ?? 0;
  return Math.round((staySubtotal - serviceFee) * 100) / 100;
}

export function calculateStayWithServiceFee(
  pricing: ListingPricing,
  startDate: string,
  endDate: string,
  guestCount = 1
) {
  const guests = Math.max(guestCount, 1);
  const nights = calculateNights(startDate, endDate);
  const subtotal = calculateStayTotal(pricing, startDate, endDate, guestCount);
  if (subtotal == null) return null;
  const serviceFee = calculateServiceFee(subtotal);
  const hostBalance = calculateHostBalance(subtotal);
  return {
    nights,
    guestCount: guests,
    subtotal,
    serviceFee,
    hostBalance,
    rateLabel: formatStayRateLabel(pricing, guestCount),
    effectiveNightlyTotal: calculateEffectiveNightlyTotal(pricing, guestCount),
    dueAtConfirmation: serviceFee,
  };
}

export function calculateHostEarnings(
  pricing: ListingPricing,
  startDate: string,
  endDate: string,
  guestCount = 1
) {
  const gross = calculateStayTotal(pricing, startDate, endDate, guestCount);
  if (gross == null) return null;
  const commission = calculateServiceFee(gross) ?? 0;
  const netEarnings = Math.round((gross - commission) * 100) / 100;
  const guests = Math.max(guestCount, 1);
  return {
    nights: calculateNights(startDate, endDate),
    guestCount: guests,
    rateLabel: formatStayRateLabel(pricing, guestCount),
    effectiveNightlyTotal: calculateEffectiveNightlyTotal(pricing, guestCount),
    gross,
    commission,
    netEarnings,
  };
}

const STAY_REQUEST_SECTION_SEP = "\n\n---\n";
const STAY_REQUEST_MOTIVATION_PREFIX = "Why I'm interested: ";
const STAY_REQUEST_MEDIA_PREFIX = "Optional media note: ";

export function formatStayRequestMessage({
  intro,
  motivation,
  mediaNote,
}: {
  intro: string;
  motivation: string;
  mediaNote?: string | null;
}) {
  let message = intro.trim();
  if (motivation.trim()) {
    message += `${STAY_REQUEST_SECTION_SEP}${STAY_REQUEST_MOTIVATION_PREFIX}${motivation.trim()}`;
  }
  if (mediaNote?.trim()) {
    message += `${STAY_REQUEST_SECTION_SEP}${STAY_REQUEST_MEDIA_PREFIX}${mediaNote.trim()}`;
  }
  return message;
}

export function parseStayRequestMessage(message: string | null | undefined) {
  const text = message?.trim() ?? "";
  if (!text) {
    return { intro: "", motivation: null as string | null, mediaNote: null as string | null };
  }

  const sections = text.split(STAY_REQUEST_SECTION_SEP);
  const intro = sections[0]?.trim() ?? "";
  let motivation: string | null = null;
  let mediaNote: string | null = null;

  for (const section of sections.slice(1)) {
    const trimmed = section.trim();
    if (trimmed.startsWith(STAY_REQUEST_MOTIVATION_PREFIX)) {
      motivation =
        trimmed.slice(STAY_REQUEST_MOTIVATION_PREFIX.length).trim() || null;
    } else if (trimmed.startsWith(STAY_REQUEST_MEDIA_PREFIX)) {
      mediaNote = trimmed.slice(STAY_REQUEST_MEDIA_PREFIX.length).trim() || null;
    }
  }

  return { intro, motivation, mediaNote };
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

export function extractUrlsFromText(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return [...new Set(text.match(URL_PATTERN) ?? [])];
}

export function isLikelyImageUrl(url: string): boolean {
  if (/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)) return true;
  return /images\.unsplash\.com|supabase\.co\/storage/i.test(url);
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "Price on request";
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Server-safe USD formatting; client components should prefer `useCurrency().formatUsd`. */
export function formatCurrencyUsd(amount: number | null | undefined) {
  return formatCurrency(amount);
}

export function missingPricingMessage(guestCount: number): string {
  const guests = Math.max(guestCount, 1);
  if (guests <= 2) return "This host has not set a nightly rate yet.";
  if (guests >= 6) {
    return "This host has not set a nightly rate for groups of 6 or more guests.";
  }
  return `This host has not set a nightly rate for ${guests} guests yet.`;
}

export function exceedsListingMaxCapacity(
  guestCount: number,
  maxCapacity: number | null | undefined
): boolean {
  if (maxCapacity == null || maxCapacity <= 0) return false;
  return Math.max(guestCount, 1) > maxCapacity;
}

export function getConfirmStayDisabledReason(
  request: {
    start_date: string | null;
    end_date: string | null;
    guest_count: number;
  },
  listingPricing: ListingPricing
): string | null {
  if (!request.start_date || !request.end_date) {
    return "Check-in and check-out dates are required before you can confirm.";
  }

  const hasAnyRate =
    listingPricing.budget_per_night != null ||
    listingPricing.budget_per_night_3_guests != null ||
    listingPricing.budget_per_night_4_guests != null ||
    listingPricing.budget_per_night_5_guests != null ||
    listingPricing.budget_per_night_6_plus_guests != null;

  if (!hasAnyRate) {
    return "Pricing is unavailable for this stay. Ask your host to set nightly rates on their listing.";
  }

  if (!hasPricingForGuestCount(listingPricing, request.guest_count)) {
    return missingPricingMessage(request.guest_count);
  }

  return null;
}
