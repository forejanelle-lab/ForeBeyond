import Link from "next/link";
import { brand, navigation } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/messaging/NotificationBell";

import type { UserRole } from "@/types/database";

interface NavigationProps {
  user?: { id: string; email: string; role?: UserRole | null; isAdmin?: boolean } | null;
}

function canHost(role?: UserRole | null) {
  return role === "host";
}

export function Navigation({ user }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-sage-dark/30 bg-cream/80 backdrop-blur-lg">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white font-bold text-sm transition-transform group-hover:scale-105">
              FB
            </div>
            <span className="text-lg font-semibold text-forest tracking-tight">
              {brand.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navigation.main.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-charcoal-light hover:text-forest transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/search">
                  <Button variant="ghost" size="sm">
                    Search
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" size="sm">
                    Messages
                  </Button>
                </Link>
                <Link href="/saved">
                  <Button variant="ghost" size="sm">
                    Saved
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                {canHost(user.role) && (
                  <Link href="/host/listings">
                    <Button variant="secondary" size="sm">
                      My Listings
                    </Button>
                  </Link>
                )}
                <Link href="/trust-center/dashboard">
                  <Button variant="secondary" size="sm">
                    Trust
                  </Button>
                </Link>
                <Link href="/verification-center">
                  <Button variant="secondary" size="sm">
                    Verification
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <NotificationBell userId={user.id} />
              </>
            ) : (
              <>
                <Link href="/auth/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <details className="md:hidden relative">
            <summary className="list-none cursor-pointer p-2 rounded-lg hover:bg-sage/50 [&::-webkit-details-marker]:hidden">
              <Menu className="h-6 w-6 text-forest open:hidden" />
              <X className="h-6 w-6 text-forest hidden open:block" />
            </summary>
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-4 flex flex-col gap-1">
              {navigation.main.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2 border-sage-dark/30" />
              {user ? (
                <>
                  <Link
                    href="/search"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Search Families
                  </Link>
                  <Link
                    href="/messages"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Messages
                  </Link>
                  <Link
                    href="/saved"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Saved
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Dashboard
                  </Link>
                  {canHost(user.role) && (
                    <Link
                      href="/host/listings"
                      className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                    >
                      My Listings
                    </Link>
                  )}
                  <Link
                    href="/trust-center/dashboard"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Trust Dashboard
                  </Link>
                  <Link
                    href="/verification-center"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Verification
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="px-3 py-2.5 text-sm font-medium text-forest hover:bg-sage/50 rounded-lg"
                    >
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/auth/sign-in"
                    className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link href="/auth/sign-up" className="mt-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </details>
        </nav>
      </Container>
    </header>
  );
}
