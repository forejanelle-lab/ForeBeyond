export const TRAVELER_INTEREST_OPTIONS = [
  "Cooking & Cuisine",
  "Music & Arts",
  "Language Learning",
  "History & Heritage",
  "Nature & Outdoors",
  "Spirituality",
  "Crafts & Handicrafts",
  "Festivals & Celebrations",
] as const;

export const TRAVELER_STYLE_OPTIONS = [
  { value: "immersive", label: "Deep Immersion", description: "Weeks-long stays with one family" },
  { value: "exploratory", label: "Cultural Explorer", description: "Multiple short experiences" },
  { value: "learning", label: "Skill Builder", description: "Focused on learning specific skills" },
] as const;

export function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatCommaSeparatedList(values: string[] | null | undefined): string {
  return (values ?? []).join(", ");
}
