import { getResendFromEmail } from "@/lib/email-config";
import { formatDateRange } from "@/lib/stay-requests";

export type HostNotificationEvent = "stay_request_submitted" | "stay_dates_changed";

export type StayAlertEvent =
  | HostNotificationEvent
  | "traveler_message"
  | "host_message"
  | "stay_approved";

interface SendHostNotificationEmailInput {
  to: string;
  hostName?: string | null;
  event: HostNotificationEvent;
  travelerName?: string | null;
  listingTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

function buildEmailContent(input: SendHostNotificationEmailInput) {
  const greeting = input.hostName?.trim() ? `Hi ${input.hostName.trim()},` : "Hi,";
  const traveler = input.travelerName?.trim() || "A guest";
  const listing = input.listingTitle?.trim() || "your listing";

  if (input.event === "stay_request_submitted") {
    const dates = formatDateRange(input.startDate ?? null, input.endDate ?? null);
    return {
      subject: `New stay request from ${traveler}`,
      html: `
        <p>${greeting}</p>
        <p><strong>${traveler}</strong> requested a stay at <strong>${listing}</strong>${dates !== "—" ? ` for ${dates}` : ""}.</p>
        <p>Review the request and respond when you're ready. Sign in to Fore Beyond to view it.</p>
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
        <p>Please review the updated request. Sign in to Fore Beyond to view it.</p>
        <p>— Fore Beyond</p>
      `,
    };
  }

  throw new Error(`Unsupported host notification event: ${input.event}`);
}

export async function sendHostNotificationEmail(
  input: SendHostNotificationEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const from = getResendFromEmail();
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SendStayApprovedEmailInput {
  to: string;
  travelerName?: string | null;
  hostName?: string | null;
  listingTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export async function sendStayApprovedEmail(
  input: SendStayApprovedEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const greeting = input.travelerName?.trim()
    ? `Hi ${escapeHtml(input.travelerName.trim())},`
    : "Hi,";
  const host = escapeHtml(input.hostName?.trim() || "Your host");
  const listing = escapeHtml(input.listingTitle?.trim() || "their listing");
  const dates = formatDateRange(input.startDate ?? null, input.endDate ?? null);
  const dateLine = dates !== "—" && dates !== "Dates not set" ? ` for ${escapeHtml(dates)}` : "";

  const from = getResendFromEmail();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `${input.hostName?.trim() || "Your host"} approved your stay request`,
      html: `
        <p>${greeting}</p>
        <p><strong>${host}</strong> approved your stay request at <strong>${listing}</strong>${dateLine}.</p>
        <p>Sign in to Fore Beyond to pay the service fee and confirm your stay.</p>
        <p>— Fore Beyond</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: body || response.statusText };
  }

  return { sent: true };
}
