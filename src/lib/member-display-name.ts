import type { StayRequestStatus } from "@/types/database";

const CONFIRMED_STAY_STATUSES: StayRequestStatus[] = ["approved", "completed"];

export function isStayNameRevealed(status: StayRequestStatus | null | undefined): boolean {
  return status != null && CONFIRMED_STAY_STATUSES.includes(status);
}

/** Masked member name for guest/host views; full name for admins or confirmed stays. */
export function formatMemberDisplayName(
  fullName: string | null | undefined,
  options?: {
    fallback?: string;
    revealFullName?: boolean;
    stayStatus?: StayRequestStatus | null;
  }
): string {
  const fallback = options?.fallback ?? "Member";
  const trimmed = fullName?.trim();
  if (!trimmed) return fallback;

  if (options?.revealFullName || isStayNameRevealed(options?.stayStatus)) {
    return trimmed;
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? fallback;

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0];
  if (!lastInitial) return firstName;

  return `${firstName} ${lastInitial.toUpperCase()}.`;
}
