const DEV_EMAIL_RATE_LIMIT_HINT =
  'Too many verification emails were sent. Wait about an hour, or disable "Confirm email" in Supabase → Authentication → Providers → Email while developing.';

const USER_EMAIL_RATE_LIMIT_MESSAGE =
  "We've sent too many emails recently. Please wait about an hour and try again.";

function isEmailRateLimitError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("over_email");
}

export function formatAuthError(error: { message?: string } | null): string {
  const message = error?.message?.trim() || "Something went wrong. Please try again.";

  if (isEmailRateLimitError(message)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth]", DEV_EMAIL_RATE_LIMIT_HINT, error);
      return DEV_EMAIL_RATE_LIMIT_HINT;
    }
    return USER_EMAIL_RATE_LIMIT_MESSAGE;
  }

  return message;
}
