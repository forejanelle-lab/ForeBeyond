import { getAppUrl } from "@/lib/app-url";
import { formatDateRange } from "@/lib/stay-requests";

export type HostNotificationEvent =
  | "stay_request_submitted"
  | "stay_dates_changed"
  | "traveler_message";

interface SendHostNotificationEmailInput {
  to: string;
  hostName?: string | null;
  event: HostNotificationEvent;
  travelerName?: string | null;
  listingTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  messagePreview?: string | null;
  actionPath: string;
}

function buildEmailContent(input: SendHostNotificationEmailInput) {
  const greeting = input.hostName?.trim() ? `Hi ${input.hostName.trim()},` : "Hi,";
  const traveler = input.travelerName?.trim() || "A guest";
  const listing = input.listingTitle?.trim() || "your listing";
  const actionUrl = `${getAppUrl()}${input.actionPath}`;

  if (input.event === "stay_request_submitted") {
    const dates = formatDateRange(input.startDate ?? null, input.endDate ?? null);
    return {
      subject: `New stay request from ${traveler}`,
      html: `
        <p>${greeting}</p>
        <p><strong>${traveler}</strong> requested a stay at <strong>${listing}</strong>${dates !== "—" ? ` for ${dates}` : ""}.</p>
        <p>Review the request and respond when you're ready.</p>
        <p><a href="${actionUrl}">View stay request</a></p>
        <p>— Fore Beyond</p>
      `,
    };
  }

  if (input.event === "stay_dates_changed") {
    const dates = formatDateRange(input.startDate ?? null, input.endDate ?? null);
    return {
      subject: `${traveler} updated stay dates`,
      html: `
        <p>${greeting}</p>
        <p><strong>${traveler}</strong> updated the dates for their stay request at <strong>${listing}</strong>.</p>
        <p>New dates: ${dates}</p>
        <p>Please review the updated request.</p>
        <p><a href="${actionUrl}">View stay request</a></p>
        <p>— Fore Beyond</p>
      `,
    };
  }

  const preview = input.messagePreview?.trim() || "Open the conversation to read their message.";
  return {
    subject: `New message from ${traveler}`,
    html: `
      <p>${greeting}</p>
      <p><strong>${traveler}</strong> sent you a message about a stay request.</p>
      <p>${preview}</p>
      <p><a href="${actionUrl}">Reply in Fore Beyond</a></p>
      <p>— Fore Beyond</p>
    `,
  };
}

export async function sendHostNotificationEmail(
  input: SendHostNotificationEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "Fore Beyond <onboarding@resend.dev>";
  const content = buildEmailContent(input);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: content.subject,
      html: content.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: body || response.statusText };
  }

  return { sent: true };
}
