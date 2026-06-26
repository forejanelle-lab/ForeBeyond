import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser: { id: string; email: string; role?: UserRole | null; isAdmin?: boolean } | null = null;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single();

    const role = profileError ? null : profile?.role ?? null;
    const isAdmin = profileError
      ? false
      : isPlatformAdmin(user.email ?? "", profile?.is_admin ?? false);

    navUser = {
      id: user.id,
      email: user.email ?? "",
      role,
      isAdmin,
    };
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-cream text-charcoal`}>
        <Navigation user={navUser} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
