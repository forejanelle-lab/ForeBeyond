export const TRAVELER_SIGNUP_DISABLED_MESSAGE =
  "We're not quite ready for new travelers yet. Please check back soon or email us to be notified when we open.";

/** Traveler signup is open by default; set NEXT_PUBLIC_TRAVELER_SIGNUP_ENABLED=false to disable. */
export function isTravelerSignupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TRAVELER_SIGNUP_ENABLED !== "false";
}
