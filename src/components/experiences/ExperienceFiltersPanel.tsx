"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  DEFAULT_EXPERIENCE_FILTERS,
  EXPERIENCE_CATEGORIES,
  PRICE_RANGES,
  TRUST_SCORE_OPTIONS,
  experienceFiltersToSearchParams,
  parseExperienceSearchParams,
  type ExperienceSearchFilters,
} from "@/lib/experience-search";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface ExperienceFiltersPanelProps {
  countries: string[];
  resultCount: number;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-charcoal">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
      >
        {options.map((option) => (
          <option key={option.value || "any"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterFields({
  filters,
  countries,
  onChange,
}: {
  filters: ExperienceSearchFilters;
  countries: string[];
  onChange: (key: keyof ExperienceSearchFilters, value: string | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Input
        label="Search"
        value={filters.q}
        onChange={(e) => onChange("q", e.target.value)}
        placeholder="Cooking, tea, hiking..."
      />
      <SelectField
        label="Category"
        value={filters.category}
        onChange={(value) => onChange("category", value)}
        options={[
          { value: "", label: "All categories" },
          ...EXPERIENCE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
        ]}
      />
      <SelectField
        label="Country"
        value={filters.country}
        onChange={(value) => onChange("country", value)}
        options={[
          { value: "", label: "All countries" },
          ...countries.map((country) => ({ value: country, label: country })),
        ]}
      />
      <Input
        label="City"
        value={filters.city}
        onChange={(e) => onChange("city", e.target.value)}
        placeholder="Any city"
      />
      <SelectField
        label="Price"
        value={filters.price}
        onChange={(value) => onChange("price", value)}
        options={PRICE_RANGES.map((range) => ({ value: range.value, label: range.label }))}
      />
      <SelectField
        label="Minimum trust score"
        value={filters.minTrustScore}
        onChange={(value) => onChange("minTrustScore", value)}
        options={TRUST_SCORE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />
      <label className="flex items-center gap-3 rounded-xl border border-sage-dark px-3 py-2.5 cursor-pointer sm:col-span-2 lg:col-span-3">
        <input
          type="checkbox"
          checked={filters.verified}
          onChange={(e) => onChange("verified", e.target.checked)}
          className="h-4 w-4 rounded border-sage-dark text-forest focus:ring-forest"
        />
        <span className="text-sm font-medium text-charcoal">Verified hosts only</span>
      </label>
    </div>
  );
}

export function ExperienceFiltersPanel({ countries, resultCount }: ExperienceFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filters = parseExperienceSearchParams(Object.fromEntries(searchParams.entries()));

  function applyFilters(next: ExperienceSearchFilters) {
    const params = experienceFiltersToSearchParams(next);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/experiences?${query}` : "/experiences");
    });
  }

  function updateFilter(key: keyof ExperienceSearchFilters, value: string | boolean) {
    applyFilters({ ...filters, [key]: value });
  }

  function clearFilters() {
    applyFilters(DEFAULT_EXPERIENCE_FILTERS);
  }

  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(DEFAULT_EXPERIENCE_FILTERS);

  return (
    <details className="group">
      <summary className="list-none cursor-pointer">
        <Card variant="outline" padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-forest font-medium">
            <SlidersHorizontal className="h-4 w-4" />
            Filters &amp; search
          </div>
          <span className="text-xs text-charcoal-light">
            {resultCount} {resultCount === 1 ? "experience" : "experiences"}
            {hasActiveFilters ? " · filtered" : ""}
          </span>
        </Card>
      </summary>
      <Card variant="outline" padding="md" className="mt-3">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-charcoal-light">
            Refine results by category, location, price, and host verification.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <FilterFields filters={filters} countries={countries} onChange={updateFilter} />
        {isPending && <p className="text-xs text-charcoal-light mt-4">Updating results...</p>}
      </Card>
    </details>
  );
}
