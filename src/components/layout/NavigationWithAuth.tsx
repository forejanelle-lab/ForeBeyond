"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [user, setUser] = useState<NavigationUser | null>(serverUser);

  useEffect(() => {
    setUser(serverUser);
  }, [serverUser]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function syncFromClient() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!authUser) {
        setUser(null);
        return;
      }

      if (serverUser?.id === authUser.id) {
        setUser(serverUser);
        return;
      }

      const navUser = await fetchNavUser(authUser.id, authUser.email ?? "");
      if (cancelled || !navUser) return;

      setUser(navUser);
      router.refresh();
    }

    void syncFromClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncFromClient();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, serverUser]);

  return <Navigation user={user} />;
}
