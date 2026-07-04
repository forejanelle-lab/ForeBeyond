import { getAppUrl } from "@/lib/app-url";
import { getResendFromEmail } from "@/lib/email-config";
import { formatDocumentTypeLabel } from "@/lib/verification-labels";

interface SendVerificationRejectionEmailInput {
  to: string;
  userName?: string | null;
  documentType: string;
  notes?: string | null;
}

export async function sendVerificationRejectionEmail(
  input: SendVerificationRejectionEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const from = getResendFromEmail();
  const docLabel = formatDocumentTypeLabel(input.documentType);
  const greeting = input.userName?.trim() ? `Hi ${input.userName.trim()},` : "Hi,";
  const noteText =
    input.notes?.trim() ||
    "Please review the feedback and resubmit from your Verification Center.";
  const verificationUrl = `${getAppUrl()}/verification-center`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: "Action needed: complete your verification",
      html: `
        <p>${greeting}</p>
        <p>Your <strong>${docLabel}</strong> submission needs to be updated before your verification can be completed.</p>
        <p>${noteText}</p>
        <p><a href="${verificationUrl}">Open Verification Center</a></p>
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
