export const PROFILE_GENDERS = ["female", "male", "non_binary", "prefer_not_to_say"] as const;

export type ProfileGender = (typeof PROFILE_GENDERS)[number];

export function isProfileGender(value: string | null | undefined): value is ProfileGender {
  return PROFILE_GENDERS.includes(value as ProfileGender);
}

export function getGenderLabelKey(gender: ProfileGender): string {
  switch (gender) {
    case "female":
      return "common.genderFemale";
    case "male":
      return "common.genderMale";
    case "non_binary":
      return "common.genderNonBinary";
    case "prefer_not_to_say":
      return "common.genderPreferNotToSay";
  }
}

export const GENDER_LABELS: Record<ProfileGender, string> = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};

export function formatGender(gender: ProfileGender | null | undefined): string | null {
  if (!gender) return null;
  return GENDER_LABELS[gender] ?? null;
}
