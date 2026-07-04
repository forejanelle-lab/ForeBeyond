import { getPlatformAdminEmail } from "@/lib/platform-admin";
import { getResendFromEmail } from "@/lib/email-config";

interface SendContactEmailInput {
  fromName: string;
  fromEmail: string;
  message: string;
  to?: string;
}

export async function sendContactEmail(
  input: SendContactEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const to =
    input.to?.trim() ||
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    getPlatformAdminEmail();
  const from = getResendFromEmail();
  const senderName = input.fromName.trim() || "Fore Beyond visitor";
  const senderEmail = input.fromEmail.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: senderEmail,
      subject: `Fore Beyond contact from ${senderName}`,
      html: `
        <p><strong>From:</strong> ${senderName} &lt;${senderEmail}&gt;</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(input.message.trim())}</p>
        <p>— Fore Beyond contact form</p>
      `,
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
