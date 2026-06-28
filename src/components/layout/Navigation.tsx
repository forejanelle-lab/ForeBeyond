import { navigation } from "@/lib/brand";
import { getAdminNav, getUserNav, isPlatformAdmin } from "@/lib/navigation-menu";
import { Logo } from "@/components/design/Logo";
import { HeaderProfileAvatar } from "@/components/layout/HeaderProfileAvatar";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { NotificationBell } from "@/components/messaging/NotificationBell";
import { Container } from "@/components/ui/Container";

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
  const showAdmin = user ? isPlatformAdmin(user.email, user.isAdmin) : false;
  const userNav = user ? (showAdmin ? getAdminNav() : getUserNav(user.role)) : [];
  const showSupport = Boolean(user) && !showAdmin;

  return (
    <header className="sticky top-0 z-50 border-b border-sage-dark/20 bg-white">
      <Container>
        <nav className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {user && <NotificationBell userId={user.id} />}
            {user && (
              <HeaderProfileAvatar
                avatarUrl={user.avatarUrl ?? null}
                fullName={user.fullName}
              />
            )}
            <MobileNavMenu
              items={user ? userNav : navigation.main}
              showSupport={showSupport}
              isLoggedIn={Boolean(user)}
              userId={user?.id}
              userFullName={user?.fullName}
              userEmail={user?.email}
            />
          </div>
        </nav>
      </Container>
    </header>
  );
}
