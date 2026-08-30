import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileGender } from "@/types/database";

export const PROFILE_SETTINGS_SELECT_WITH_GENDER =
  "full_name, gender, bio, location, phone, role, avatar_url, onboarding_complete";

export const PROFILE_SETTINGS_SELECT_BASE =
  "full_name, bio, location, phone, role, avatar_url, onboarding_complete";

export type ProfileSettingsFields = Pick<
  Profile,
  | "full_name"
  | "gender"
  | "bio"
  | "location"
  | "phone"
  | "role"
  | "avatar_url"
  | "onboarding_complete"
>;

function isMissingGenderColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42703" || /column profiles\.gender does not exist/i.test(error.message ?? "");
}

export { isMissingGenderColumn };

/** Load editable profile fields; falls back when migration 077 is not applied yet. */
export async function loadProfileSettingsFields(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: ProfileSettingsFields | null; error: string | null; genderSupported: boolean }> {
  const withGender = await supabase
    .from("profiles")
    .select(PROFILE_SETTINGS_SELECT_WITH_GENDER)
    .eq("id", userId)
    .single();

  if (!withGender.error && withGender.data) {
    return {
      data: withGender.data as ProfileSettingsFields,
      error: null,
      genderSupported: true,
    };
  }

  if (!isMissingGenderColumn(withGender.error)) {
    return {
      data: null,
      error: withGender.error?.message ?? "Could not load profile.",
      genderSupported: false,
    };
  }

  const fallback = await supabase
    .from("profiles")
    .select(PROFILE_SETTINGS_SELECT_BASE)
    .eq("id", userId)
    .single();

  if (fallback.error || !fallback.data) {
    return {
      data: null,
      error: fallback.error?.message ?? "Could not load profile.",
      genderSupported: false,
    };
  }

  return {
    data: {
      ...(fallback.data as Omit<ProfileSettingsFields, "gender">),
      gender: null as ProfileGender | null,
    },
    error: null,
    genderSupported: false,
  };
}
