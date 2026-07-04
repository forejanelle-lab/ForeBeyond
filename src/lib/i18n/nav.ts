import type { Translator } from "@/lib/i18n/translator";
import type { NavItem } from "@/lib/navigation-menu";
import type { UserRole } from "@/types/database";
import { isPlatformAdmin } from "@/lib/platform-admin";

export function getTranslatedMainNav(t: Translator): NavItem[] {
  return [
    { label: t("nav.howItWorks"), href: "/#how-it-works" },
    { label: t("nav.about"), href: "/#mission" },
    { label: t("nav.contact"), href: "mailto:hello@forebeyond.com" },
  ];
}

export function getTranslatedTravelerNav(t: Translator): NavItem[] {
  return [
    { label: t("nav.searchFamilies"), href: "/search" },
    { label: t("nav.myTrips"), href: "/trips" },
    { label: t("nav.experiences"), href: "/experiences" },
    { label: t("nav.saved"), href: "/saved" },
    { label: t("nav.messages"), href: "/messages" },
    { label: t("nav.trustCenter"), href: "/trust-center/dashboard" },
  ];
}

export function getTranslatedHostNav(t: Translator): NavItem[] {
  return [
    { label: t("nav.requests"), href: "/host/requests" },
    { label: t("nav.myListings"), href: "/host/listings" },
    { label: t("nav.experiences"), href: "/host/experiences" },
    { label: t("nav.messages"), href: "/messages" },
    { label: t("nav.trustCenter"), href: "/trust-center/dashboard" },
  ];
}

export function getTranslatedUserNav(t: Translator, role?: UserRole | null): NavItem[] {
  return role === "host" ? getTranslatedHostNav(t) : getTranslatedTravelerNav(t);
}

export function getTranslatedAdminNav(t: Translator): NavItem[] {
  return [
    { label: t("nav.adminOverview"), href: "/admin" },
    { label: t("nav.adminUsers"), href: "/admin/users" },
    { label: t("nav.adminListings"), href: "/admin/listings" },
    { label: t("nav.adminVerifications"), href: "/admin/verifications" },
    { label: t("nav.adminReviews"), href: "/admin/reviews" },
    { label: t("nav.adminReports"), href: "/admin/reports" },
    { label: t("nav.adminSupport"), href: "/admin/support" },
    { label: t("nav.adminTrustScores"), href: "/admin/trust-scores" },
  ];
}

export function getTranslatedNavForUser(
  t: Translator,
  user?: {
    email: string;
    role?: UserRole | null;
    isAdmin?: boolean;
  } | null
): NavItem[] {
  if (!user) return getTranslatedMainNav(t);
  const showAdmin = isPlatformAdmin(user.email, user.isAdmin);
  return showAdmin ? getTranslatedAdminNav(t) : getTranslatedUserNav(t, user.role);
}
