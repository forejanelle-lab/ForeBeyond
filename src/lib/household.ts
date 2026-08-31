export const HOUSEHOLD_GENDERS = ["female", "male"] as const;
export type HouseholdGender = (typeof HOUSEHOLD_GENDERS)[number];

export const HOUSEHOLD_AGE_GROUPS = ["adult", "teen", "child"] as const;
export type HouseholdAgeGroup = (typeof HOUSEHOLD_AGE_GROUPS)[number];

export const PREFERRED_GUEST_GENDERS = ["female", "male", "all"] as const;
export type PreferredGuestGender = (typeof PREFERRED_GUEST_GENDERS)[number];

export interface HouseholdMember {
  label: string;
  gender: HouseholdGender;
  age_group?: HouseholdAgeGroup;
}

export const HOUSEHOLD_GENDER_LABELS: Record<HouseholdGender, string> = {
  female: "Female",
  male: "Male",
};

export const HOUSEHOLD_AGE_GROUP_LABELS: Record<HouseholdAgeGroup, string> = {
  adult: "Adult",
  teen: "Teen",
  child: "Child",
};

export const PREFERRED_GUEST_GENDER_LABELS: Record<PreferredGuestGender, string> = {
  female: "Women",
  male: "Male guests",
  all: "All guests",
};

export const PREFERRED_GUEST_GENDER_CHOICES: Record<PreferredGuestGender, string> = {
  female: "Women",
  male: "Male",
  all: "All",
};

export function defaultHouseholdMemberLabel(index: number): string {
  return `Person #${index + 1}`;
}

export function isHouseholdGender(value: string | null | undefined): value is HouseholdGender {
  return HOUSEHOLD_GENDERS.includes(value as HouseholdGender);
}

export function isHouseholdAgeGroup(value: string | null | undefined): value is HouseholdAgeGroup {
  return HOUSEHOLD_AGE_GROUPS.includes(value as HouseholdAgeGroup);
}

export function isPreferredGuestGender(
  value: string | null | undefined
): value is PreferredGuestGender {
  return PREFERRED_GUEST_GENDERS.includes(value as PreferredGuestGender);
}

export function parseHouseholdMembers(value: unknown): HouseholdMember[] {
  let parsed: unknown = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { label?: unknown; gender?: unknown; age_group?: unknown };
    const gender = typeof record.gender === "string" ? record.gender : null;
    if (!isHouseholdGender(gender)) return [];
    const ageGroup =
      typeof record.age_group === "string" && isHouseholdAgeGroup(record.age_group)
        ? record.age_group
        : undefined;
    const label =
      typeof record.label === "string" && record.label.trim()
        ? record.label.trim()
        : defaultHouseholdMemberLabel(index);
    return ageGroup ? [{ label, gender, age_group: ageGroup }] : [{ label, gender }];
  });
}

export function parsePreferredGuestGender(value: unknown): PreferredGuestGender {
  if (typeof value === "string" && isPreferredGuestGender(value)) return value;
  return "all";
}

export function formatHouseholdMember(member: HouseholdMember): string {
  const details = [HOUSEHOLD_GENDER_LABELS[member.gender]];
  if (member.age_group) details.push(HOUSEHOLD_AGE_GROUP_LABELS[member.age_group]);
  return `${member.label} (${details.join(", ")})`;
}

export function formatPreferredGuestGender(value: PreferredGuestGender): string {
  return PREFERRED_GUEST_GENDER_LABELS[value];
}

export function isMissingHouseholdColumnsError(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    /household_members|preferred_guest_gender/i.test(message) &&
    (/schema cache/i.test(message) || /does not exist/i.test(message) || /PGRST204/i.test(message))
  );
}
