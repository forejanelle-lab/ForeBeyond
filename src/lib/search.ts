import {
  LISTING_ACTIVITIES,
  LISTING_MEALS,
} from "@/lib/listings";
import type { PublicListing } from "@/types/database";

export const BUDGET_RANGES = [
  { value: "", label: "Any budget" },
  { value: "0-50", label: "Under $50/night", min: 0, max: 50 },
  { value: "50-100", label: "$50 – $100/night", min: 50, max: 100 },
  { value: "100-150", label: "$100 – $150/night", min: 100, max: 150 },
  { value: "150+", label: "$150+/night", min: 150, max: null },
] as const;

export const TRUST_SCORE_OPTIONS = [
  { value: "", label: "Any trust score" },
  { value: "40", label: "40+ Trust Score" },
  { value: "60", label: "60+ Trust Score" },
  { value: "80", label: "80+ Trust Score" },
] as const;

export const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Japanese",
  "Mandarin",
  "Portuguese",
  "Arabic",
  "German",
  "Italian",
  "Yoruba",
] as const;

export interface SearchFilters {
  country: string;
  city: string;
  budget: string;
  language: string;
  meal: string;
  activity: string;
  verified: boolean;
  minTrustScore: string;
  q: string;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  country: "",
  city: "",
  budget: "",
  language: "",
  meal: "",
  activity: "",
  verified: false,
  minTrustScore: "",
  q: "",
};

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): SearchFilters {
  const get = (key: keyof SearchFilters) => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };

  return {
    country: get("country"),
    city: get("city"),
    budget: get("budget"),
    language: get("language"),
    meal: get("meal"),
    activity: get("activity"),
    verified: get("verified") === "1",
    minTrustScore: get("minTrustScore"),
    q: get("q"),
  };
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  (Object.entries(filters) as [keyof SearchFilters, string | boolean][]).forEach(
    ([key, value]) => {
      if (key === "verified") {
        if (value) params.set("verified", "1");
        return;
      }
      if (typeof value === "string" && value.trim()) {
        params.set(key, value.trim());
      }
    }
  );
  return params;
}

export function getBudgetRange(value: string) {
  return BUDGET_RANGES.find((range) => range.value === value);
}

export function formatBudget(perNight: number | null | undefined) {
  if (perNight == null) return "Budget on request";
  return `$${perNight}/night`;
}

export function filterListingsClientSide(
  listings: PublicListing[],
  filters: SearchFilters
): PublicListing[] {
  const budgetRange = getBudgetRange(filters.budget);
  const minTrust = filters.minTrustScore ? parseInt(filters.minTrustScore, 10) : 0;
  const query = filters.q.trim().toLowerCase();

  return listings.filter((listing) => {
    if (filters.country && listing.country?.toLowerCase() !== filters.country.toLowerCase()) {
      return false;
    }
    if (filters.city && !listing.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.language && !listing.languages?.some(
      (lang) => lang.toLowerCase() === filters.language.toLowerCase()
    )) {
      return false;
    }
    if (filters.meal && !listing.meals?.includes(filters.meal)) {
      return false;
    }
    if (filters.activity && !listing.family_activities?.includes(filters.activity)) {
      return false;
    }
    if (filters.verified && listing.verification_status !== "verified") {
      return false;
    }
    if (minTrust > 0 && listing.trust_score < minTrust) {
      return false;
    }
    if (budgetRange && budgetRange.value) {
      const budget = listing.budget_per_night;
      if (budget == null) return false;
      if (budgetRange.min != null && budget < budgetRange.min) return false;
      if (budgetRange.max != null && budget > budgetRange.max) return false;
    }
    if (query) {
      const haystack = [
        listing.title,
        listing.family_story,
        listing.city,
        listing.country,
        listing.host_first_name,
        ...(listing.languages ?? []),
        ...(listing.meals ?? []),
        ...(listing.family_activities ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function getUniqueCountries(listings: PublicListing[]) {
  return [...new Set(listings.map((l) => l.country).filter(Boolean) as string[])].sort();
}

export { LISTING_MEALS, LISTING_ACTIVITIES };
