import type { Profile } from "@/types/database";

/** Fields hidden from other users until a stay request is approved */
const PRIVATE_FIELDS = ["email", "phone", "full_name"] as const;

export function maskProfileForPublic(
  profile: Partial<Profile>,
  canViewPrivate: boolean
): Partial<Profile> {
  if (canViewPrivate) return profile;

  const masked = { ...profile };
  for (const field of PRIVATE_FIELDS) {
    if (field in masked) {
      (masked as Record<string, unknown>)[field] = null;
    }
  }
  if (masked.full_name) {
    masked.full_name = masked.full_name.split(" ")[0] ?? masked.full_name;
  }
  return masked;
}
