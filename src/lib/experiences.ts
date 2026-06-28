import type { ExperienceCategory, ExperienceStatus } from "@/types/database";
import { sampleImages } from "@/lib/sample-images";

export const EXPERIENCE_CATEGORIES: {
  value: ExperienceCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "family_dinner",
    label: "Family Dinners",
    description: "Share a home-cooked meal and conversation with a local family.",
  },
  {
    value: "cooking_class",
    label: "Cooking Classes",
    description: "Learn traditional recipes and techniques in a family kitchen.",
  },
  {
    value: "market_tour",
    label: "Market Tours",
    description: "Explore local markets and discover ingredients with your host.",
  },
  {
    value: "tea_ceremony",
    label: "Tea Ceremonies",
    description: "Experience the ritual, history, and hospitality of tea culture.",
  },
  {
    value: "cultural_workshop",
    label: "Cultural Workshops",
    description: "Hands-on crafts, traditions, and skills passed down through generations.",
  },
  {
    value: "hiking",
    label: "Hiking Experiences",
    description: "Walk scenic trails with a local who knows the land and its stories.",
  },
  {
    value: "other",
    label: "Other",
    description: "A unique experience that doesn't fit the categories above — describe your own.",
  },
];

export const EXPERIENCE_INCLUDES = [
  "Ingredients included",
  "Meal included",
  "Transportation provided",
  "English interpretation",
  "Take-home recipe",
  "Photo opportunities",
  "Small group (max 6)",
] as const;

export const EXPERIENCE_REQUIREMENTS = [
  "Moderate fitness level",
  "Comfortable walking shoes",
  "Dietary restrictions noted in advance",
  "Arrive 10 minutes early",
  "Children welcome with adult",
  "Modest dress appreciated",
] as const;

export const EXPERIENCE_STATUS_LABELS: Record<
  ExperienceStatus,
  { label: string; variant: "outline" | "success" | "default" }
> = {
  draft: { label: "Draft", variant: "outline" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

export function getCategoryLabel(category: ExperienceCategory) {
  return EXPERIENCE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

const EXPERIENCE_HERO_IMAGES: Record<ExperienceCategory, string> = {
  family_dinner: sampleImages.experiencesDining,
  cooking_class: sampleImages.cookingClass,
  market_tour: sampleImages.marketTour,
  tea_ceremony: sampleImages.teaCeremony,
  cultural_workshop: sampleImages.experiencesWorkshop,
  hiking: sampleImages.hiking,
  other: sampleImages.experiencesHero,
};

export function getExperienceHeroImage(category: ExperienceCategory) {
  return EXPERIENCE_HERO_IMAGES[category] ?? sampleImages.experiencesHero;
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "Duration varies";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatPrice(price: number | null | undefined) {
  if (price == null) return "Price on request";
  return `$${price}/person`;
}

export function generateExperienceTitle(
  category: ExperienceCategory,
  city: string,
  country: string
) {
  const label = getCategoryLabel(category);
  const location = [city, country].filter(Boolean).join(", ");
  return location ? `${label} in ${location}` : label;
}
