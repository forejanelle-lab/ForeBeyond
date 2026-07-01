"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { HelpCircle, Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { ContactModal } from "@/components/support/ContactModal";
import { SupportRequestModal } from "@/components/support/SupportRequestModal";
import { TravelerSignupButton } from "@/components/auth/TravelerSignupButton";
import { isExternalNavHref, isMailtoNavHref } from "@/lib/nav-links";
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
  const [contactOpen, setContactOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menuPanel = open && mounted ? (
    <>
      <button
        type="button"
        aria-label="Close menu overlay"
        className="fixed inset-0 z-[100] bg-black/20"
        onClick={() => setOpen(false)}
      />
      <div
        role="menu"
        className="fixed right-4 top-[calc(4rem+0.5rem)] z-[101] w-64 max-h-[min(80vh,calc(100dvh-5.5rem))] overflow-y-auto rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-4 flex flex-col gap-1"
      >
        {items.map((item) => {
          const itemClassName =
            "px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg transition-colors";

          if (isMailtoNavHref(item.href)) {
            return (
              <button
                key={item.href}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setContactOpen(true);
                }}
                className={`${itemClassName} w-full text-left`}
              >
                {item.label}
              </button>
            );
          }

          if (isExternalNavHref(item.href)) {
            return (
              <a
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`${itemClassName} block`}
              >
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClassName}
            >
              {item.label}
            </Link>
          );
        })}
        {showSupport && userId && (
          <button
            type="button"
            role="menuitem"
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
              role="menuitem"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg"
            >
              Sign In
            </Link>
            <TravelerSignupButton variant="primary" size="sm" className="w-full mt-1">
              Get Started
            </TravelerSignupButton>
          </>
        )}
      </div>
    </>
  ) : null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="relative z-[102] p-2 rounded-lg hover:bg-sage/50 transition-colors"
      >
        {open ? (
          <X className="h-6 w-6 text-forest" />
        ) : (
          <Menu className="h-6 w-6 text-forest" />
        )}
      </button>

      {menuPanel && createPortal(menuPanel, document.body)}

      {showSupport && userId && (
        <SupportRequestModal
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          userId={userId}
          fullName={userFullName}
          email={userEmail}
        />
      )}

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        userId={isLoggedIn ? userId : undefined}
        fullName={userFullName}
        email={userEmail}
      />
    </div>
  );
}
