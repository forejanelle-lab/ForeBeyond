export async function tryRecordLoginAudit(authMethod: string): Promise<void> {
  try {
    await fetch("/api/auth/record-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authMethod }),
      keepalive: true,
    });
  } catch {
    // Login should succeed even if activity tracking fails.
  }
}
