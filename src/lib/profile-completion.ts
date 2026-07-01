import { isPlatformAdmin } from "@/lib/navigation-menu";
import type { OnboardingStep, UserRole } from "@/types/database";

export const PROFILE_COMPLETE_PATH = "/profile/complete";

const PROFILE_COMPLETE_ALLOWLIST_PREFIXES = [
  PROFILE_COMPLETE_PATH,
  "/auth/",
  "/api/",
] as const;

export type ProfileCompletionState = {
  role?: UserRole | null;
  onboarding_step?: OnboardingStep | null;
  is_admin?: boolean;
};

export function isProfileCompletionAllowlisted(pathname: string): boolean {
  return PROFILE_COMPLETE_ALLOWLIST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/** True until the user submits the initial profile + role step. */
export function needsProfileCompletion(
  email: string,
  profile: ProfileCompletionState | null | undefined
): boolean {
  if (isPlatformAdmin(email, profile?.is_admin ?? false)) {
    return false;
  }

  if (!profile?.role) {
    return true;
  }

  return profile.onboarding_step === "profile";
}
