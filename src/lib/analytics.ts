import { track } from "@vercel/analytics";

export const AnalyticsEvents = {
  HOMEPAGE_VIEW: "Homepage View",
  SEARCH: "Search",
  FAMILY_PROFILE_VIEW: "Family Profile View",
  EXPERIENCE_VIEW: "Experience View",
  REQUEST_START: "Request Start",
  REQUEST_SUBMISSION: "Request Submission",
  TRAVELER_SIGNUP: "Traveler Signup",
  HOST_SIGNUP: "Host Signup",
  VERIFICATION_COMPLETION: "Verification Completion",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export function trackEvent(
  name: AnalyticsEventName,
  data?: Record<string, string | number | boolean>
) {
  const payload = data
    ? Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]))
    : undefined;
  track(name, payload);
}
