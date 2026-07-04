"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface LogoutButtonProps {
  variant?: "button" | "menu";
}

export function LogoutButton({ variant = "button" }: LogoutButtonProps) {
  const router = useRouter();
  const t = useTranslations();

  async function handleLogout() {
    const supabase = createClient();
    posthog.capture("user_logged_out");
    posthog.reset();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="w-full text-left px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-sage/50 rounded-lg transition-colors"
      >
        {t("nav.logOut")}
      </button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      {t("nav.logOut")}
    </Button>
  );
}
