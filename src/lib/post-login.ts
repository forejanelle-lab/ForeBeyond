import { isPlatformAdmin } from "@/lib/navigation-menu";
import { needsProfileCompletion } from "@/lib/profile-completion";
import type { OnboardingStep, UserRole } from "@/types/database";

type PostLoginProfile = {
  is_admin?: boolean;
  role?: UserRole | null;
  onboarding_step?: OnboardingStep | null;
} | null;

/** Default destination after sign-in (admins always land on overview unless already targeting /admin). */
export function getPostLoginPath(
  email: string,
  profile: PostLoginProfile,
  redirectParam?: string | null
): string {
  if (needsProfileCompletion(email, profile)) {
    return "/profile/complete";
  }

  const isAdmin = isPlatformAdmin(email, profile?.is_admin ?? false);

  if (isAdmin) {
    if (redirectParam?.startsWith("/admin")) {
      return redirectParam;
    }
    return "/admin";
  }

  if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/auth")) {
    return redirectParam;
  }

  if (profile?.role === "host") return "/host/requests";
  return "/trips";
}
