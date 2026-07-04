import { Inter } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SupabaseConfigNotice } from "@/components/layout/SupabaseConfigNotice";
import { AppProviders } from "@/components/layout/AppProviders";
import { isPlatformAdmin } from "@/lib/navigation-menu";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getServerTranslations } from "@/lib/i18n/server";
import { rootMetadata } from "@/lib/site-metadata";
import type { UserRole } from "@/types/database";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = rootMetadata;

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
      .select("role, is_admin, avatar_url, full_name, default_currency")
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
      defaultCurrency: profileError ? "USD" : profile?.default_currency ?? "USD",
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

  const [navUser, { rates: initialExchangeRates }] = await Promise.all([
    loadNavUser(),
    getExchangeRates(),
  ]);
  const { locale, messages } = await getServerTranslations();

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-cream text-charcoal`}>
        <AppProviders
          locale={locale}
          messages={messages}
          initialCurrency={navUser?.defaultCurrency}
          initialExchangeRates={initialExchangeRates}
        >
          <Navigation user={navUser} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
