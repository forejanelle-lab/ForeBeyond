import type { SupabaseClient } from "@supabase/supabase-js";

export const HOST_ONBOARDING_PATH = "/onboarding/host";

const HOST_ONBOARDING_ALLOWLIST_PREFIXES = [
  HOST_ONBOARDING_PATH,
  "/profile/complete",
  "/auth/",
  "/api/",
  "/verification-center",
] as const;

export type HostOnboardingProfileInput = {
  cultural_offerings: string[];
  household_description: string;
  experience_description: string;
  city: string;
  country: string;
  neighborhood: string;
  max_guests: number;
  languages_spoken: string[];
  host_motivation: string | null;
};

export function isHostOnboardingAllowlisted(pathname: string): boolean {
  return HOST_ONBOARDING_ALLOWLIST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

export function needsHostOnboarding(profile: {
  role?: string | null;
  onboarding_complete?: boolean | null;
} | null | undefined): boolean {
  return profile?.role === "host" && !profile.onboarding_complete;
}

export async function completeHostOnboarding(
  supabase: SupabaseClient,
  userId: string,
  input: HostOnboardingProfileInput
): Promise<{ error: string | null }> {
  const { error: hostProfileError } = await supabase.from("host_profiles").upsert(
    {
      user_id: userId,
      cultural_offerings: input.cultural_offerings,
      household_description: input.household_description,
      experience_description: input.experience_description,
      city: input.city,
      country: input.country,
      neighborhood: input.neighborhood,
      max_guests: input.max_guests,
      languages_spoken: input.languages_spoken,
      host_motivation: input.host_motivation,
    },
    { onConflict: "user_id" }
  );

  if (hostProfileError) {
    return { error: hostProfileError.message };
  }

  const location = [input.city.trim(), input.country.trim()].filter(Boolean).join(", ");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: "host",
      onboarding_step: "complete",
      onboarding_complete: true,
      ...(location ? { location } : {}),
    })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  return { error: null };
}
