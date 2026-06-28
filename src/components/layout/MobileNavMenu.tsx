"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { SupportRequestModal } from "@/components/support/SupportRequestModal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { NavItem } from "@/lib/navigation-menu";

interface MobileNavMenuProps {
  items: readonly NavItem[];
  showSupport?: boolean;
  isLoggedIn: boolean;
  userId?: string;
  userFullName?: string | null;
  userEmail?: string;
}

export function MobileNavMenu({
  items,
  showSupport = false,
  isLoggedIn,
  userId = "",
  userFullName = null,
  userEmail = "",
}: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-sage/50 transition-colors"
      >
        {open ? (
          <X className="h-6 w-6 text-forest" />
        ) : (
          <Menu className="h-6 w-6 text-forest" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-4 flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {showSupport && userId && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSupportOpen(true);
                }}
                className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg transition-colors text-left inline-flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4 text-forest" />
                Help &amp; Support
              </button>
            )}
            <hr className="my-2 border-sage-dark/30" />
            {isLoggedIn ? (
              <LogoutButton variant="menu" />
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
                >
                  Sign In
                </Link>
                <ButtonLink
                  href="/auth/sign-up"
                  variant="primary"
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </ButtonLink>
              </>
            )}
          </div>
        </>
      )}

      {showSupport && userId && (
        <SupportRequestModal
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          userId={userId}
          fullName={userFullName}
          email={userEmail}
        />
      )}
    </div>
  );
}
