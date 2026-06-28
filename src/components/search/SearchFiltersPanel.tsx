"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  BUDGET_RANGES,
  COMMON_LANGUAGES,
  DEFAULT_SEARCH_FILTERS,
  LISTING_ACTIVITIES,
  LISTING_MEALS,
  TRUST_SCORE_OPTIONS,
  filtersToSearchParams,
  parseSearchParams,
  type SearchFilters,
} from "@/lib/search";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface SearchFiltersPanelProps {
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
  onSubmit,
}: {
  filters: SearchFilters;
  countries: string[];
  onChange: (key: keyof SearchFilters, value: string | boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        label="Search"
        value={filters.q}
        onChange={(e) => onChange("q", e.target.value)}
        placeholder="Family, city, culture..."
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
        label="Budget"
        value={filters.budget}
        onChange={(value) => onChange("budget", value)}
        options={BUDGET_RANGES.map((range) => ({ value: range.value, label: range.label }))}
      />
      <SelectField
        label="Language"
        value={filters.language}
        onChange={(value) => onChange("language", value)}
        options={[
          { value: "", label: "Any language" },
          ...COMMON_LANGUAGES.map((lang) => ({ value: lang, label: lang })),
        ]}
      />
      <SelectField
        label="Meals included"
        value={filters.meal}
        onChange={(value) => onChange("meal", value)}
        options={[
          { value: "", label: "Any meals" },
          ...LISTING_MEALS.map((meal) => ({ value: meal, label: meal })),
        ]}
      />
      <SelectField
        label="Activities"
        value={filters.activity}
        onChange={(value) => onChange("activity", value)}
        options={[
          { value: "", label: "Any activities" },
          ...LISTING_ACTIVITIES.map((activity) => ({ value: activity, label: activity })),
        ]}
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
      <label className="flex items-center gap-3 rounded-xl border border-sage-dark px-3 py-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.verified}
          onChange={(e) => onChange("verified", e.target.checked)}
          className="h-4 w-4 rounded border-sage-dark text-forest focus:ring-forest"
        />
        <span className="text-sm font-medium text-charcoal">Verified hosts only</span>
      </label>

      <Button type="submit" variant="primary" size="md" className="w-full justify-center gap-2">
        <Search className="h-4 w-4" />
        Search families
      </Button>
    </form>
  );
}

export function SearchFiltersPanel({ countries, resultCount }: SearchFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const appliedFilters = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(appliedFilters);

  useEffect(() => {
    setDraftFilters(parseSearchParams(Object.fromEntries(searchParams.entries())));
  }, [searchParams]);

  function applyFilters(next: SearchFilters) {
    const params = filtersToSearchParams(next);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/search?${query}` : "/search");
    });
  }

  function updateDraft(key: keyof SearchFilters, value: string | boolean) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch() {
    applyFilters(draftFilters);
  }

  function clearFilters() {
    setDraftFilters(DEFAULT_SEARCH_FILTERS);
    applyFilters(DEFAULT_SEARCH_FILTERS);
  }

  const hasActiveFilters =
    JSON.stringify(appliedFilters) !== JSON.stringify(DEFAULT_SEARCH_FILTERS);
  const hasDraftChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const panelBody = (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-charcoal-light">
          {resultCount} {resultCount === 1 ? "family" : "families"} found
          {hasDraftChanges && !isPending && (
            <span className="text-gold"> · press Search to apply</span>
          )}
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
      <FilterFields
        filters={draftFilters}
        countries={countries}
        onChange={updateDraft}
        onSubmit={handleSearch}
      />
      {isPending && (
        <p className="text-xs text-charcoal-light mt-4">Updating results...</p>
      )}
    </>
  );

  return (
    <>
      <Card variant="outline" padding="md" className="hidden lg:block sticky top-24 mb-6">
        <div className="flex items-center gap-2 text-forest font-medium mb-4">
          <SlidersHorizontal className="h-4 w-4" />
          Filters &amp; search
          {hasActiveFilters && (
            <span className="text-xs font-normal text-gold">(active)</span>
          )}
        </div>
        {panelBody}
      </Card>

      <details className="group lg:hidden mb-6">
        <summary className="list-none cursor-pointer">
          <Card variant="outline" padding="md" className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-forest font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Filters &amp; search
              {hasActiveFilters && (
                <span className="text-xs font-normal text-gold">(active)</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal-light">
              <span>{resultCount} {resultCount === 1 ? "family" : "families"}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </div>
          </Card>
        </summary>
        <Card variant="outline" padding="md" className="mt-3">
          {panelBody}
        </Card>
      </details>
    </>
  );
}
