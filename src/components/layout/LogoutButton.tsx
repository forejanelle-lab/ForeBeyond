"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface LogoutButtonProps {
  variant?: "button" | "menu";
}

export function LogoutButton({ variant = "button" }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
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
        Log out
      </button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Log out
    </Button>
  );
}
