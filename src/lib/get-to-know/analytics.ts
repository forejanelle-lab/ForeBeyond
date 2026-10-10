import posthog from "posthog-js";

export const GetToKnowEvents = {
  STARTED: "get_to_know_started",
  COMPLETED: "get_to_know_completed",
  SHARED_INTERESTS_VIEWED: "shared_interests_viewed",
  CONVERSATION_PROMPT_SELECTED: "conversation_prompt_selected",
  HOST_MESSAGE_STARTED: "host_message_started",
  BOOKING_REQUEST_STARTED: "booking_request_started",
} as const;

export function captureGetToKnowEvent(
  event: (typeof GetToKnowEvents)[keyof typeof GetToKnowEvents],
  properties?: Record<string, string | number | boolean | null>
) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the traveler flow.
  }
}
