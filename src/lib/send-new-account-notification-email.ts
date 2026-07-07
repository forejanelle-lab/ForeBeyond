import { getAppUrl } from "@/lib/app-url";
import { BUSINESS_EMAIL, getResendFromEmail } from "@/lib/email-config";

interface SendNewAccountNotificationEmailInput {
  email: string;
  fullName?: string | null;
  userId: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendNewAccountNotificationEmail(
  input: SendNewAccountNotificationEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const from = getResendFromEmail();
  const name = input.fullName?.trim() || "New member";
  const adminUserUrl = `${getAppUrl()}/admin/users/${input.userId}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: BUSINESS_EMAIL,
      subject: `New account — ${name}`,
      html: `
        <p>A new Fore Beyond account was created.</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>User ID:</strong> ${escapeHtml(input.userId)}</p>
        <p><a href="${adminUserUrl}">View in admin</a></p>
        <p>— Fore Beyond signup notification</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: body || response.statusText };
  }

  return { sent: true };
}
