import type { BookingPaymentStatus, StayRequestStatus } from "@/types/database";

export const STAY_REQUEST_STATUS_LABELS: Record<
  StayRequestStatus,
  { label: string; variant: "outline" | "success" | "warning" | "default" }
> = {
  pending: { label: "Pending", variant: "warning" },
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
  pending: { label: "Payment Pending", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
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

export function calculateNights(startDate: string, endDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

export function calculateStayTotal(nightlyRate: number | null, startDate: string, endDate: string) {
  if (nightlyRate == null) return null;
  return nightlyRate * calculateNights(startDate, endDate);
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "Price on request";
  return `$${amount.toLocaleString()}`;
}
