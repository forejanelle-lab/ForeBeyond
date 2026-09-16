import { getResendFromEmail } from "@/lib/email-config";

interface SendMessageNotificationEmailInput {
  to: string;
  recipientName?: string | null;
  senderName?: string | null;
  listingTitle?: string | null;
  messagePreview?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMessageNotificationEmail(
  input: SendMessageNotificationEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const greeting = input.recipientName?.trim()
    ? `Hi ${escapeHtml(input.recipientName.trim())},`
    : "Hi,";
  const sender = escapeHtml(input.senderName?.trim() || "Someone");
  const listing = input.listingTitle?.trim()
    ? ` about <strong>${escapeHtml(input.listingTitle.trim())}</strong>`
    : "";
  const preview = input.messagePreview?.trim()
    ? `<p>${escapeHtml(input.messagePreview.trim())}</p>`
    : "";

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
      subject: `New message from ${input.senderName?.trim() || "Fore Beyond"}`,
      html: `
        <p>${greeting}</p>
        <p><strong>${sender}</strong> sent you a message${listing}.</p>
        ${preview}
        <p>Sign in to Fore Beyond to read and reply.</p>
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
