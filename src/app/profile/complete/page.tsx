"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/lib/brand";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/types/database";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Pick<
    Profile,
    | "full_name"
    | "bio"
    | "location"
    | "phone"
    | "role"
    | "avatar_url"
    | "onboarding_complete"
  > | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/sign-in?redirect=/profile/complete");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, bio, location, phone, role, avatar_url, onboarding_complete")
        .eq("id", user.id)
        .single();

      setUserId(user.id);
      setEmail(user.email ?? "");
      setProfile(data as typeof profile);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading || !userId || !profile) {
    return (
      <Container size="sm" className="py-16 md:py-24">
        <AuthBrandHeader />
        <p className="text-center text-charcoal-light">Loading profile...</p>
      </Container>
    );
  }

  return (
    <Container size="sm" className="py-16 md:py-24">
      <AuthBrandHeader />
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
