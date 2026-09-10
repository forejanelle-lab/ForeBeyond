/** Destination autocomplete for hero search — only countries that currently have hosts. */

export interface DestinationSuggestion {
  label: string;
  country: string;
  city: string;
}

export function hostCountrySuggestions(countries: string[]): DestinationSuggestion[] {
  return [...new Set(countries.map((country) => country.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((country) => ({
      label: country,
      country,
      city: "",
    }));
}

export function filterDestinationSuggestions(
  query: string,
  countries: string[] = [],
  limit?: number
): DestinationSuggestion[] {
  const pool = hostCountrySuggestions(countries);
  const q = query.trim().toLowerCase();
  const matches = q
    ? pool.filter((suggestion) => suggestion.label.toLowerCase().includes(q))
    : pool;
  return limit ? matches.slice(0, limit) : matches;
}
