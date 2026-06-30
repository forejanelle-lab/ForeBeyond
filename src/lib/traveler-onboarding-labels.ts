import type { TravelerProfile } from "@/types/database";

export const TRAVEL_STYLE_LABELS: Record<string, string> = {
  immersive: "Deep Immersion",
  exploratory: "Cultural Explorer",
  learning: "Skill Builder",
};

export function formatTravelStyle(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return TRAVEL_STYLE_LABELS[value] ?? value;
}

export type TravelerOnboardingForHost = Pick<
  TravelerProfile,
  | "interests"
  | "travel_style"
  | "dietary_preferences"
  | "accessibility_needs"
  | "stay_motivation"
>;

export function hasTravelerOnboardingDetails(
  profile: TravelerOnboardingForHost | null | undefined
): boolean {
  if (!profile) return false;
  return Boolean(
    (profile.interests?.length ?? 0) > 0 ||
      profile.travel_style?.trim() ||
      (profile.dietary_preferences?.length ?? 0) > 0 ||
      profile.accessibility_needs?.trim() ||
      profile.stay_motivation?.trim()
  );
}
