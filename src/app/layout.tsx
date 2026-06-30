import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavigationWithAuth } from "@/components/layout/NavigationWithAuth";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SupabaseConfigNotice } from "@/components/layout/SupabaseConfigNotice";
import { brand } from "@/lib/brand";
import { isPlatformAdmin } from "@/lib/navigation-menu";
import type { UserRole } from "@/types/database";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.mission,
  keywords: [
    "cultural immersion",
    "authentic travel",
    "local families",
    "trust-first travel",
    "meaningful connections",
  ],
};

async function loadNavUser() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_admin, avatar_url, full_name")
      .eq("id", user.id)
      .single();

    const role = profileError ? null : profile?.role ?? null;
    const isAdmin = profileError
      ? false
      : isPlatformAdmin(user.email ?? "", profile?.is_admin ?? false);

    return {
      id: user.id,
      email: user.email ?? "",
      role: role as UserRole | null,
      isAdmin,
      avatarUrl: profileError ? null : profile?.avatar_url ?? null,
      fullName: profileError ? null : profile?.full_name ?? null,
    };
  } catch (error) {
    console.error("Layout nav user load failed:", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isSupabaseConfigured()) {
    return (
      <html lang="en" className={inter.variable}>
        <body className={`${inter.className} min-h-screen antialiased bg-cream text-charcoal`}>
          <SupabaseConfigNotice />
        </body>
      </html>
    );
  }

  const navUser = await loadNavUser();

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-cream text-charcoal`}>
        <NavigationWithAuth serverUser={navUser} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
