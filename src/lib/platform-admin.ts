/** Default platform admin — must match scripts/wipe-except-admin.mjs */
export const DEFAULT_PLATFORM_ADMIN_EMAIL = "forebeyond@gmail.com";

export function getPlatformAdminEmail(): string {
  return (process.env.PLATFORM_ADMIN_EMAIL || DEFAULT_PLATFORM_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
}

/** Platform admin: profile flag plus allowlisted email (defaults to forebeyond@gmail.com). */
export function isPlatformAdmin(email: string, isAdmin?: boolean): boolean {
  if (!isAdmin) return false;
  return email.trim().toLowerCase() === getPlatformAdminEmail();
}
