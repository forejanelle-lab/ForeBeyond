import type { StayRequestStatus } from "@/types/database";

const CONFIRMED_STAY_STATUSES: StayRequestStatus[] = ["approved", "completed"];

/** Hosts reviewing a stay request should see who requested, not a generic label. */
const HOST_VISIBLE_GUEST_NAME_STATUSES: StayRequestStatus[] = [
  "pending",
  "host_approved",
  "approved",
  "completed",
];

export function isStayNameRevealed(status: StayRequestStatus | null | undefined): boolean {
  return status != null && CONFIRMED_STAY_STATUSES.includes(status);
}

export function isHostGuestNameVisible(status: StayRequestStatus | null | undefined): boolean {
  return status != null && HOST_VISIBLE_GUEST_NAME_STATUSES.includes(status);
}

export function resolveGuestDisplayName(sources: {
  profileFullName?: string | null;
  requestDisplayName?: string | null;
  email?: string | null;
}): string | null {
  const profileName = sources.profileFullName?.trim();
  if (profileName) return profileName;

  const requestName = sources.requestDisplayName?.trim();
  if (requestName) return requestName;

  const emailLocal = sources.email?.split("@")[0]?.trim();
  if (emailLocal) return emailLocal;

  return null;
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

export function formatHostGuestDisplayName(
  sources: {
    profileFullName?: string | null;
    requestDisplayName?: string | null;
    email?: string | null;
  },
  stayStatus: StayRequestStatus | null | undefined,
  fallback = "Guest"
): string {
  const resolved = resolveGuestDisplayName(sources);
  return formatMemberDisplayName(resolved, {
    fallback,
    revealFullName: isHostGuestNameVisible(stayStatus),
    stayStatus,
  });
}
