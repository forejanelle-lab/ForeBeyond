export const LISTING_MEALS = [
  "No Meals Included",
  "Some Meals - Will Specify",
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

export function extractHostFirstName(fullName?: string | null): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function defaultFamilyListingTitle(hostName?: string | null): string {
  const firstName = extractHostFirstName(hostName);
  if (!firstName) return "The Family";
  return `${firstName}'s Family`;
}

export function generateListingTitle(city: string, country: string, hostName?: string | null) {
  const location = [city, country].filter(Boolean).join(", ");
  if (hostName) return `${hostName}'s Family in ${location}`;
  return location ? `Family Home in ${location}` : "Untitled Listing";
}

export type ListingPricingTier = "standard" | "3" | "4" | "5" | "6_plus";

export function parseListingMaxCapacity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return Math.min(parsed, 20);
}

export function resolveListingMaxCapacity(
  value: string | number | null | undefined,
  fallback = 8
): number {
  if (typeof value === "number" && value > 0) return Math.min(value, 20);
  const parsed = parseListingMaxCapacity(String(value ?? ""));
  return parsed ?? fallback;
}

export function minGuestsForListingPricingTier(tier: ListingPricingTier): number {
  switch (tier) {
    case "standard":
      return 1;
    case "3":
      return 3;
    case "4":
      return 4;
    case "5":
      return 5;
    case "6_plus":
      return 6;
  }
}

export function isListingPricingTierEnabled(
  maxCapacity: number | null,
  tier: ListingPricingTier
): boolean {
  if (maxCapacity == null) return true;
  return minGuestsForListingPricingTier(tier) <= maxCapacity;
}

export function maxCapacityExceededMessage(maxCapacity: number): string {
  const label = maxCapacity === 1 ? "1 guest" : `${maxCapacity} guests`;
  return `This host can accommodate up to ${label}. Please reduce your guest count.`;
}

export function formatListingMaxCapacityLabel(maxCapacity: number): string {
  return maxCapacity === 1 ? "1 guest" : `${maxCapacity} guests`;
}
