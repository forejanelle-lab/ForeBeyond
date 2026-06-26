export const LISTING_MEALS = [
  "Breakfast included",
  "Shared home cooking",
  "Vegetarian options",
  "Halal options",
  "Family dinner nightly",
  "Packed lunch available",
] as const;

export const LISTING_AMENITIES = [
  "Private room",
  "Shared room",
  "Private bathroom",
  "Shared bathroom",
  "WiFi",
  "Laundry access",
  "Workspace",
  "Garden access",
  "Pet-friendly home",
  "Air conditioning",
] as const;

export const LISTING_ACTIVITIES = [
  "Cooking together",
  "Local market visits",
  "Festival participation",
  "Language lessons",
  "Neighborhood walks",
  "Craft workshops",
  "Music & storytelling",
  "Farming & gardening",
  "Religious or cultural ceremonies",
] as const;

export const LISTING_HOUSE_RULES = [
  "No smoking",
  "Quiet hours after 10pm",
  "Shoes off indoors",
  "Guests join family meals",
  "Respect local customs",
  "No overnight visitors",
  "Children welcome",
  "Modest dress appreciated",
] as const;

export const LISTING_STATUS_LABELS = {
  draft: { label: "Draft", variant: "outline" as const },
  published: { label: "Published", variant: "success" as const },
  archived: { label: "Archived", variant: "default" as const },
};

export function extractHostLastName(fullName?: string | null): string {
  if (!fullName?.trim()) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? "";
}

export function defaultFamilyListingTitle(hostName?: string | null): string {
  const lastName = extractHostLastName(hostName);
  if (!lastName) return "The Family";
  return `The ${lastName} Family`;
}

export function generateListingTitle(city: string, country: string, hostName?: string | null) {
  const location = [city, country].filter(Boolean).join(", ");
  if (hostName) return `${hostName}'s Family in ${location}`;
  return location ? `Family Home in ${location}` : "Untitled Listing";
}
