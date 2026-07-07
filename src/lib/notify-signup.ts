export async function notifyNewSignup(userId: string): Promise<void> {
  try {
    await fetch("/api/auth/notify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
      keepalive: true,
    });
  } catch {
    // Signup should succeed even if the admin notification fails.
  }
}
