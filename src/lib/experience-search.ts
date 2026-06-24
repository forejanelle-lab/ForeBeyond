import { EXPERIENCE_CATEGORIES } from "@/lib/experiences";
import type { ExperienceCategory, PublicExperience } from "@/types/database";

export const PRICE_RANGES = [
  { value: "", label: "Any price" },
  { value: "0-25", label: "Under $25/person", min: 0, max: 25 },
  { value: "25-50", label: "$25 – $50/person", min: 25, max: 50 },
  { value: "50-100", label: "$50 – $100/person", min: 50, max: 100 },
  { value: "100+", label: "$100+/person", min: 100, max: null },
] as const;

export const TRUST_SCORE_OPTIONS = [
  { value: "", label: "Any trust score" },
  { value: "40", label: "40+ Trust Score" },
  { value: "60", label: "60+ Trust Score" },
  { value: "80", label: "80+ Trust Score" },
] as const;

export interface ExperienceSearchFilters {
  category: string;
  country: string;
  city: string;
  price: string;
  verified: boolean;
  minTrustScore: string;
  q: string;
}

export const DEFAULT_EXPERIENCE_FILTERS: ExperienceSearchFilters = {
  category: "",
  country: "",
  city: "",
  price: "",
  verified: false,
  minTrustScore: "",
  q: "",
};

export function parseExperienceSearchParams(
  params: Record<string, string | string[] | undefined>
): ExperienceSearchFilters {
  const get = (key: keyof ExperienceSearchFilters) => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };

  return {
    category: get("category"),
    country: get("country"),
    city: get("city"),
    price: get("price"),
    verified: get("verified") === "1",
    minTrustScore: get("minTrustScore"),
    q: get("q"),
  };
}

export function experienceFiltersToSearchParams(
  filters: ExperienceSearchFilters
): URLSearchParams {
  const params = new URLSearchParams();
  (Object.entries(filters) as [keyof ExperienceSearchFilters, string | boolean][]).forEach(
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

function getPriceRange(value: string) {
  return PRICE_RANGES.find((range) => range.value === value);
}

export function filterExperiencesClientSide(
  experiences: PublicExperience[],
  filters: ExperienceSearchFilters
): PublicExperience[] {
  const priceRange = getPriceRange(filters.price);
  const minTrust = filters.minTrustScore ? parseInt(filters.minTrustScore, 10) : 0;
  const query = filters.q.trim().toLowerCase();

  return experiences.filter((exp) => {
    if (filters.category && exp.category !== filters.category) return false;
    if (filters.country && exp.country?.toLowerCase() !== filters.country.toLowerCase()) {
      return false;
    }
    if (filters.city && !exp.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.verified && exp.verification_status !== "verified") return false;
    if (minTrust > 0 && exp.trust_score < minTrust) return false;
    if (priceRange && priceRange.value) {
      const price = exp.price_per_person;
      if (price == null) return false;
      if (priceRange.min != null && price < priceRange.min) return false;
      if (priceRange.max != null && price > priceRange.max) return false;
    }
    if (query) {
      const haystack = [
        exp.title,
        exp.description,
        exp.city,
        exp.country,
        exp.host_first_name,
        getCategoryLabel(exp.category),
        ...(exp.languages ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function getCategoryLabel(category: ExperienceCategory) {
  return EXPERIENCE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function getUniqueExperienceCountries(experiences: PublicExperience[]) {
  return [...new Set(experiences.map((e) => e.country).filter(Boolean) as string[])].sort();
}

export { EXPERIENCE_CATEGORIES };
