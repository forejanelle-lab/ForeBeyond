/** Shared transactional and auth email settings for Fore Beyond. */

export const BUSINESS_EMAIL = "hello@forebeyond.com";

export const EMAIL_SENDER_NAME = "Fore Beyond";

export const DEFAULT_FROM_EMAIL = `${EMAIL_SENDER_NAME} <${BUSINESS_EMAIL}>`;

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}
