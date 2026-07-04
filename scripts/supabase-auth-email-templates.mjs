import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, "..", "supabase", "email-templates");

export const BUSINESS_EMAIL = "hello@forebeyond.com";
export const EMAIL_SENDER_NAME = "Fore Beyond";

function readTemplate(name) {
  return fs.readFileSync(path.join(templatesDir, `${name}.html`), "utf8").trim();
}

export function buildSupabaseAuthEmailConfig() {
  return {
    mailer_subjects_confirmation: "Verify your Fore Beyond account",
    mailer_templates_confirmation_content: readTemplate("confirmation"),
    mailer_subjects_recovery: "Reset your Fore Beyond password",
    mailer_templates_recovery_content: readTemplate("recovery"),
    mailer_subjects_magic_link: "Your Fore Beyond sign-in link",
    mailer_templates_magic_link_content: readTemplate("magic-link"),
    mailer_subjects_email_change: "Confirm your new Fore Beyond email address",
    mailer_templates_email_change_content:
      '<h2 style="color:#214E34;font-family:Georgia,serif;">Confirm your new email address</h2><p style="font-family:system-ui,sans-serif;line-height:1.6;">Click below to confirm <strong>{{ .NewEmail }}</strong> as your new Fore Beyond email address.</p><p><a href="{{ .ConfirmationURL }}" style="background-color:#214E34;border-radius:8px;color:#ffffff;display:inline-block;font-family:system-ui,sans-serif;padding:12px 24px;text-decoration:none;">Confirm new email</a></p><p style="color:#666666;font-size:14px;">If you did not request this change, contact <a href="mailto:hello@forebeyond.com">hello@forebeyond.com</a>.</p>',
    mailer_subjects_invite: "You are invited to Fore Beyond",
    mailer_templates_invite_content:
      '<h2 style="color:#214E34;font-family:Georgia,serif;">You are invited</h2><p style="font-family:system-ui,sans-serif;line-height:1.6;">You have been invited to join Fore Beyond. Click below to accept your invitation.</p><p><a href="{{ .ConfirmationURL }}" style="background-color:#214E34;border-radius:8px;color:#ffffff;display:inline-block;font-family:system-ui,sans-serif;padding:12px 24px;text-decoration:none;">Accept invitation</a></p>',
    mailer_subjects_reauthentication: "{{ .Token }} is your Fore Beyond verification code",
    mailer_templates_reauthentication_content:
      '<h2 style="color:#214E34;font-family:Georgia,serif;">Your verification code</h2><p style="font-family:system-ui,sans-serif;line-height:1.6;">Use this code to verify your identity. It expires shortly.</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">{{ .Token }}</p>',
  };
}
