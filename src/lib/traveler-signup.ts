export const TRAVELER_SIGNUP_DISABLED_MESSAGE =
  "We're not quite ready for new travelers yet. Please check back soon or email us to be notified when we open.";

/** Traveler (guest) signup is open in local dev; production stays closed unless explicitly enabled. */
export function isTravelerSignupEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_TRAVELER_SIGNUP_ENABLED === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}
