"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Heart,
  MessageSquare,
  Shield,
  Settings,
  Inbox,
  Sparkles,
  List,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const travelerNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "My Trips", icon: Compass },
  { href: "/saved", label: "Saved Families", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/trust-center/dashboard", label: "Trust Center", icon: Shield },
  { href: "/settings/privacy", label: "Settings", icon: Settings },
];

const hostNav: DashboardNavItem[] = [
  { href: "/host/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/host/requests", label: "Requests", icon: Inbox },
  { href: "/host/listings", label: "My Listings", icon: List },
  { href: "/host/experiences", label: "Experiences", icon: Sparkles },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/trust-center/dashboard", label: "Trust Center", icon: Shield },
  { href: "/settings/privacy", label: "Settings", icon: Settings },
];

interface DashboardShellProps {
  variant: "traveler" | "host";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DashboardShell({ variant, title, subtitle, children }: DashboardShellProps) {
  const pathname = usePathname();
  const nav = variant === "host" ? hostNav : travelerNav;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream">
      <Container className="py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider px-3 mb-3">
                {variant === "host" ? "Host" : "Traveler"}
              </p>
              <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
                {nav.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/host/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        active
                          ? "bg-forest text-white shadow-sm"
                          : "text-charcoal-light hover:bg-sage/60 hover:text-forest"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-forest">{title}</h1>
              {subtitle && (
                <p className="mt-1.5 text-sm text-charcoal-light">{subtitle}</p>
              )}
            </header>
            {children}
          </div>
        </div>
      </Container>
    </div>
  );
}

export { travelerNav, hostNav };
