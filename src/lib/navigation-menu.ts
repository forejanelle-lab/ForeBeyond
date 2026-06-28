import type { UserRole } from "@/types/database";

export interface NavItem {
  label: string;
  href: string;
}

export function getTravelerNav(): NavItem[] {
  return [
    { label: "Search Families", href: "/search" },
    { label: "My Trips", href: "/trips" },
    { label: "Experiences", href: "/experiences" },
    { label: "Saved", href: "/saved" },
    { label: "Messages", href: "/messages" },
    { label: "Trust Center", href: "/trust-center/dashboard" },
  ];
}

export function getHostNav(): NavItem[] {
  return [
    { label: "Requests", href: "/host/requests" },
    { label: "My Listings", href: "/host/listings" },
    { label: "Experiences", href: "/host/experiences" },
    { label: "Messages", href: "/messages" },
    { label: "Trust Center", href: "/trust-center/dashboard" },
  ];
}

export function getUserNav(role?: UserRole | null): NavItem[] {
  return role === "host" ? getHostNav() : getTravelerNav();
}

/** Admin sidebar links — shown instead of traveler/host nav for platform admins */
export function getAdminNav(): NavItem[] {
  return [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Listings", href: "/admin/listings" },
    { label: "Verifications", href: "/admin/verifications" },
    { label: "Reviews", href: "/admin/reviews" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Support", href: "/admin/support" },
    { label: "Trust Scores", href: "/admin/trust-scores" },
  ];
}

/** Platform admin: must be flagged in DB and match allowlisted email */
export function isPlatformAdmin(email: string, isAdmin?: boolean): boolean {
  if (!isAdmin) return false;
  const allowed = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowed) return false;
  return email.trim().toLowerCase() === allowed;
}
