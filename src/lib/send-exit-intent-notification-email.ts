import { getAppUrl } from "@/lib/app-url";
import { BUSINESS_EMAIL, getResendFromEmail } from "@/lib/email-config";
import type { ExitIntentInterest } from "@/types/database";

interface SendExitIntentNotificationEmailInput {
  email: string;
  interest: ExitIntentInterest;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInterest(interest: ExitIntentInterest): string {
  if (interest === "hosting") return "Hosting travelers";
  if (interest === "traveling") return "Traveling";
  return "Both hosting and traveling";
}

export async function sendExitIntentNotificationEmail(
  input: SendExitIntentNotificationEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const from = getResendFromEmail();
  const interestLabel = formatInterest(input.interest);
  const submittedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: BUSINESS_EMAIL,
      subject: `Exit popup lead — ${input.email}`,
      html: `
        <p>Someone submitted their email in the exit-intent popup.</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Interest:</strong> ${escapeHtml(interestLabel)}</p>
        <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
        <p><a href="${getAppUrl()}">Open Fore Beyond</a></p>
        <p>— Fore Beyond exit intent notification</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: body || response.statusText };
  }

  return { sent: true };
}
