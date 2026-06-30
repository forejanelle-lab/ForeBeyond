"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPlatformAdmin } from "@/lib/navigation-menu";
import { Navigation } from "@/components/layout/Navigation";
import type { UserRole } from "@/types/database";

export type NavigationUser = {
  id: string;
  email: string;
  role?: UserRole | null;
  isAdmin?: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
};

interface NavigationWithAuthProps {
  serverUser: NavigationUser | null;
}

async function fetchNavUser(userId: string, email: string): Promise<NavigationUser | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, avatar_url, full_name")
    .eq("id", userId)
    .single();

  return {
    id: userId,
    email,
    role: profile?.role ?? null,
    isAdmin: isPlatformAdmin(email, profile?.is_admin ?? false),
    avatarUrl: profile?.avatar_url ?? null,
    fullName: profile?.full_name ?? null,
  };
}

export function NavigationWithAuth({ serverUser }: NavigationWithAuthProps) {
  const [user, setUser] = useState<NavigationUser | null>(serverUser);

  useEffect(() => {
    setUser(serverUser);
  }, [serverUser]);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;

    try {
      supabase = createClient();
    } catch (error) {
      console.error("Navigation auth client unavailable:", error);
      return;
    }

    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      try {
        if (event === "SIGNED_OUT" || !session?.user) {
          setUser(null);
          return;
        }

        if (serverUser?.id === session.user.id) {
          setUser(serverUser);
          return;
        }

        const navUser = await fetchNavUser(session.user.id, session.user.email ?? "");
        if (!cancelled && navUser) {
          setUser(navUser);
        }
      } catch (error) {
        console.error("Navigation auth sync failed:", error);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [serverUser]);

  return <Navigation user={user} />;
};
