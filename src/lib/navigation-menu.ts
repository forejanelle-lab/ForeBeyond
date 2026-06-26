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
    { label: "Saved Experiences", href: "/experiences/saved" },
    { label: "Messages", href: "/messages" },
    { label: "Trust Center", href: "/trust-center/dashboard" },
    { label: "Settings", href: "/settings" },
  ];
}

export function getHostNav(): NavItem[] {
  return [
    { label: "Pending Requests", href: "/host/requests" },
    { label: "My Listings", href: "/host/listings" },
    { label: "Experiences", href: "/host/experiences" },
    { label: "Messages", href: "/messages" },
    { label: "Trust Center", href: "/trust-center/dashboard" },
    { label: "Settings", href: "/settings" },
  ];
}

export function getUserNav(role?: UserRole | null): NavItem[] {
  return role === "host" ? getHostNav() : getTravelerNav();
}

/** Platform admin: must be flagged in DB and match allowlisted email */
export function isPlatformAdmin(email: string, isAdmin?: boolean): boolean {
  if (!isAdmin) return false;
  const allowed = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowed) return false;
  return email.trim().toLowerCase() === allowed;
}
