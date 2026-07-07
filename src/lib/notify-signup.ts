interface NotifyNewSignupInput {
  userId: string;
  email: string;
  fullName?: string;
}

export async function notifyNewSignup(input: NotifyNewSignupInput): Promise<void> {
  try {
    const response = await fetch("/api/auth/notify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      keepalive: true,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      console.error("notify-signup failed:", payload.error ?? response.statusText);
    }
  } catch (error) {
    console.error("notify-signup error:", error);
  }
}
