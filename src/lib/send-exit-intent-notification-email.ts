import { getAppUrl } from "@/lib/app-url";
import { getNotificationRecipients, getResendFromEmail } from "@/lib/email-config";
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
  const leadsUrl = `${getAppUrl()}/admin/newsletter`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: getNotificationRecipients(),
      subject: `Newsletter popup signup — ${input.email}`,
      html: `
        <p>Someone signed up through the newsletter popup.</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Interest:</strong> ${escapeHtml(interestLabel)}</p>
        <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
        <p><a href="${leadsUrl}">View newsletter signups</a></p>
        <p>— Fore Beyond newsletter notification</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: body || response.statusText };
  }

  return { sent: true };
}
