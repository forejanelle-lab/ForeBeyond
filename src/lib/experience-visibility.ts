import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExperienceVisibility, PublicExperience } from "@/types/database";

export const EXPERIENCE_VISIBILITY_LABELS: Record<
  ExperienceVisibility,
  { label: string; description: string }
> = {
  all_members: {
    label: "Everyone on Fore Beyond",
    description: "Any member can find and book this in the experiences marketplace.",
  },
  approved_guests_only: {
    label: "Your accommodation guests only",
    description:
      "Only travelers with an approved stay at your home can see and book this.",
  },
};

export const EXPERIENCE_VISIBILITY_OPTIONS: {
  value: ExperienceVisibility;
  title: string;
  description: string;
}[] = [
  {
    value: "all_members",
    title: EXPERIENCE_VISIBILITY_LABELS.all_members.label,
    description: EXPERIENCE_VISIBILITY_LABELS.all_members.description,
  },
  {
    value: "approved_guests_only",
    title: EXPERIENCE_VISIBILITY_LABELS.approved_guests_only.label,
    description: EXPERIENCE_VISIBILITY_LABELS.approved_guests_only.description,
  },
];

/** Host IDs where the traveler has an approved or completed stay request */
export function buildApprovedHostIdSet(
  stayRequests: { host_id: string; status: string }[]
): Set<string> {
  return new Set(
    stayRequests
      .filter((r) => r.status === "approved" || r.status === "completed")
      .map((r) => r.host_id)
  );
}

export function canViewExperience(
  experience: Pick<PublicExperience, "visibility" | "host_id">,
  options: {
    userId?: string | null;
    approvedHostIds?: Set<string>;
  }
): boolean {
  if (experience.visibility === "all_members") return true;
  if (!options.userId) return false;
  if (options.userId === experience.host_id) return true;
  return options.approvedHostIds?.has(experience.host_id) ?? false;
}

export function filterExperiencesByVisibility(
  experiences: PublicExperience[],
  options: {
    userId?: string | null;
    approvedHostIds?: Set<string>;
  }
): PublicExperience[] {
  return experiences.filter((exp) => canViewExperience(exp, options));
}

export async function fetchApprovedHostIdsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("stay_requests")
    .select("host_id, status")
    .eq("traveler_id", userId);

  return buildApprovedHostIdSet(data ?? []);
}
