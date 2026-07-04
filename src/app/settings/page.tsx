import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { TravelerPreferencesForm } from "@/components/settings/TravelerPreferencesForm";
import { DisplayPreferencesForm } from "@/components/settings/DisplayPreferencesForm";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PasswordSettingsActions } from "@/components/settings/PasswordSettingsActions";
import type { Profile } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata = privatePageMetadata({
  title: "Settings",
  description: "Manage your Fore Beyond account, privacy, and communication preferences.",
  path: "/settings",
});

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, phone, bio, location, role, avatar_url, onboarding_complete, default_currency"
    )
    .eq("id", user.id)
    .single();

  const travelerProfile =
    profile?.role === "traveler"
      ? (
          await supabase
            .from("traveler_profiles")
            .select("interests, travel_style, dietary_preferences, accessibility_needs")
            .eq("user_id", user.id)
            .maybeSingle()
        ).data
      : null;

  const typedProfile = profile as Pick<
    Profile,
    | "full_name"
    | "email"
    | "phone"
    | "bio"
    | "location"
    | "role"
    | "avatar_url"
    | "onboarding_complete"
    | "default_currency"
  > | null;

  const { t } = await getServerTranslations();

  return (
    <PageShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <ProfileSettingsForm
            userId={user.id}
            email={user.email ?? typedProfile?.email ?? ""}
            initial={{
              full_name: typedProfile?.full_name ?? null,
              bio: typedProfile?.bio ?? null,
              location: typedProfile?.location ?? null,
              phone: typedProfile?.phone ?? null,
              role: typedProfile?.role ?? null,
              avatar_url: typedProfile?.avatar_url ?? null,
              onboarding_complete: typedProfile?.onboarding_complete ?? false,
            }}
          />
        </div>

        {typedProfile?.role === "traveler" && (
          <div className="lg:col-span-2">
            <TravelerPreferencesForm userId={user.id} initial={travelerProfile} />
          </div>
        )}

        <div className="lg:col-span-2">
          <DisplayPreferencesForm
            userId={user.id}
            initialCurrency={typedProfile?.default_currency ?? "USD"}
          />
        </div>

        <Card variant="outline" padding="lg" className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">Account & privacy</h2>
          <p className="text-sm text-charcoal-light">
            Update privacy preferences, download your data, or permanently delete your account.
          </p>
          <div className="flex flex-col gap-2">
            <ButtonLink href="/settings/privacy" variant="outline" size="sm" className="w-full justify-center">
              Privacy settings
            </ButtonLink>
            <ButtonLink href="/settings/download-data" variant="outline" size="sm" className="w-full justify-center">
              Download my data
            </ButtonLink>
            <ButtonLink
              href="/settings/delete-account"
              variant="ghost"
              size="sm"
              className="w-full justify-center text-red-600"
            >
              Delete account
            </ButtonLink>
          </div>
        </Card>

        <Card variant="outline" padding="lg" className="space-y-3">
          <h2 className="text-lg font-semibold text-forest">Password</h2>
          <p className="text-sm text-charcoal-light">
            Fore Beyond uses email and password sign-in. Change your password below, or request a
            reset link sent to your account email.
          </p>
          <PasswordSettingsActions email={user.email ?? typedProfile?.email ?? ""} />
        </Card>
      </div>
    </PageShell>
  );
}
