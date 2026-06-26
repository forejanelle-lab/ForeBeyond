import { navigation } from "@/lib/brand";
import { getUserNav, isPlatformAdmin } from "@/lib/navigation-menu";
import { Logo } from "@/components/design/Logo";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { NotificationBell } from "@/components/messaging/NotificationBell";
import { Container } from "@/components/ui/Container";

import type { UserRole } from "@/types/database";

interface NavigationProps {
  user?: { id: string; email: string; role?: UserRole | null; isAdmin?: boolean } | null;
}

export function Navigation({ user }: NavigationProps) {
  const userNav = user ? getUserNav(user.role) : [];
  const showAdmin = user ? isPlatformAdmin(user.email, user.isAdmin) : false;

  return (
    <header className="sticky top-0 z-50 border-b border-sage-dark/20 bg-white">
      <Container>
        <nav className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {user && <NotificationBell userId={user.id} />}
            <MobileNavMenu
              items={user ? userNav : navigation.main}
              showAdmin={showAdmin}
              isLoggedIn={Boolean(user)}
            />
          </div>
        </nav>
      </Container>
    </header>
  );
}
