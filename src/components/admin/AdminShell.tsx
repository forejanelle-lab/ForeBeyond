"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  Building2,
  ShieldCheck,
  Star,
  Flag,
  Gauge,
} from "lucide-react";
import { ADMIN_NAV } from "@/lib/admin";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

const navIcons: Record<string, typeof LayoutDashboard> = {
  "/admin": LayoutDashboard,
  "/admin/users": Users,
  "/admin/hosts": Home,
  "/admin/listings": Building2,
  "/admin/verifications": ShieldCheck,
  "/admin/reviews": Star,
  "/admin/reports": Flag,
  "/admin/trust-scores": Gauge,
};

interface AdminShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream">
      <Container className="py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-4">
              <div>
                <Badge variant="gold" className="mb-2">Internal</Badge>
                <h2 className="text-lg font-bold text-forest">Admin Dashboard</h2>
                <p className="text-xs text-charcoal-light mt-1">Platform management</p>
              </div>
              <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
                {ADMIN_NAV.map((item) => {
                  const Icon = navIcons[item.href] ?? LayoutDashboard;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        active
                          ? "bg-forest text-white shadow-sm"
                          : "text-charcoal-light hover:bg-sage/60 hover:text-forest"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-forest">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-charcoal-light">{description}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </Container>
    </div>
  );
}
