"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/design/Logo";
import { HeaderProfileAvatar } from "@/components/layout/HeaderProfileAvatar";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { NotificationBell } from "@/components/messaging/NotificationBell";
import { Container } from "@/components/ui/Container";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getTranslatedNavForUser,
  getTranslatedPublicNav,
} from "@/lib/i18n/nav";
import { isPlatformAdmin } from "@/lib/navigation-menu";
import type { UserRole } from "@/types/database";

interface NavigationProps {
  user?: {
    id: string;
    email: string;
    role?: UserRole | null;
    isAdmin?: boolean;
    avatarUrl?: string | null;
    fullName?: string | null;
  } | null;
}

export function Navigation({ user }: NavigationProps) {
  const t = useTranslations();
  const showAdmin = user ? isPlatformAdmin(user.email, user.isAdmin) : false;
  const publicNav = getTranslatedPublicNav(t);
  const accountNav = user ? getTranslatedNavForUser(t, user) : publicNav;
  const showSupport = Boolean(user) && !showAdmin;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sage-dark/15 overflow-x-clip overflow-y-visible">
      <Container className="overflow-visible">
        <nav className="flex h-16 md:h-[4.25rem] items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
          <span className="shrink-0 md:hidden">
            <Logo size="sm" className="-my-1" />
          </span>
          <span className="hidden shrink-0 md:inline-flex">
            <Logo size="xl" className="-my-6" />
          </span>

          <div className="hidden lg:flex items-center justify-center gap-8 flex-1">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-charcoal hover:text-forest transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-auto min-w-0">
            <Link
              href="/saved"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-charcoal hover:text-forest transition-colors rounded-lg hover:bg-sage/40"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline">{t("nav.saved")}</span>
            </Link>

            <LanguageSelector userId={user?.id} className="shrink-0" />

            {user && <NotificationBell userId={user.id} />}

            {user ? (
              <HeaderProfileAvatar
                avatarUrl={user.avatarUrl ?? null}
                fullName={user.fullName}
              />
            ) : (
              <Link
                href="/auth/sign-in"
                className="hidden lg:inline-flex text-sm font-medium text-forest hover:text-forest-light px-3 py-2 transition-colors"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <div className={user ? "" : "lg:hidden"}>
              <MobileNavMenu
                items={accountNav}
                showSupport={showSupport}
                isLoggedIn={Boolean(user)}
                userId={user?.id}
                userFullName={user?.fullName}
                userEmail={user?.email}
              />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
