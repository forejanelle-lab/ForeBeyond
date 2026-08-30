"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/lib/brand";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  loadProfileSettingsFields,
  type ProfileSettingsFields,
} from "@/lib/profile-settings-query";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileSettingsFields | null>(null);
  const [genderSupported, setGenderSupported] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/sign-in?redirect=/profile/complete");
        return;
      }

      const result = await loadProfileSettingsFields(supabase, user.id);

      setUserId(user.id);
      setEmail(user.email ?? "");
      setProfile(result.data);
      setGenderSupported(result.genderSupported);
      setLoadError(result.error ?? "");
      setLoading(false);
    }

    void load();
  }, [router]);

  if (loading) {
    return (
      <Container size="sm" className="py-16 md:py-24">
        <p className="text-center text-charcoal-light">Loading profile...</p>
      </Container>
    );
  }

  if (loadError || !userId || !profile) {
    return (
      <Container size="sm" className="py-16 md:py-24">
        <div className="text-center space-y-4">
          <p className="text-charcoal-light">
            {loadError || "We could not load your profile. Please try again."}
          </p>
          <ButtonLink href="/auth/sign-in" variant="primary" size="md">
            Back to sign in
          </ButtonLink>
        </div>
      </Container>
    );
  }

  return (
    <Container size="sm" className="py-16 md:py-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-forest">Complete your profile</h1>
        <p className="mt-2 text-charcoal-light">
          Tell us a bit about yourself and how you&apos;ll use {brand.name}.
        </p>
      </div>

      <ProfileSettingsForm
        userId={userId}
        email={email}
        initial={profile}
        genderSupported={genderSupported}
        showRolePicker={!profile.role}
        redirectAfterSave={
          profile.onboarding_complete
            ? "/settings"
            : undefined
        }
      />
    </Container>
  );
}
