import { isPlatformAdmin } from "@/lib/navigation-menu";
import type { UserRole } from "@/types/database";

type PostLoginProfile = {
  is_admin?: boolean;
  role?: UserRole | null;
} | null;

/** Default destination after sign-in (admins always land on overview unless already targeting /admin). */
export function getPostLoginPath(
  email: string,
  profile: PostLoginProfile,
  redirectParam?: string | null
): string {
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
