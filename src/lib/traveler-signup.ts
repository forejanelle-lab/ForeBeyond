export const TRAVELER_SIGNUP_ENABLED = false;

export const TRAVELER_SIGNUP_DISABLED_MESSAGE =
  "We're not quite ready for new travelers yet. Please check back soon or email us to be notified when we open.";

export function isTravelerSignupEnabled(): boolean {
  return TRAVELER_SIGNUP_ENABLED;
}
