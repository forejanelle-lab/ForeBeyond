/** Destination autocomplete for hero search — countries A–Z */

import { COUNTRIES } from "@/lib/countries";

export interface DestinationSuggestion {
  label: string;
  country: string;
  city: string;
}

export const DESTINATION_SUGGESTIONS: DestinationSuggestion[] = COUNTRIES.map((country) => ({
  label: country,
  country,
  city: "",
}));

export function filterDestinationSuggestions(
  query: string,
  limit?: number
): DestinationSuggestion[] {
  const q = query.trim().toLowerCase();
  const matches = q
    ? DESTINATION_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(q))
    : DESTINATION_SUGGESTIONS;
  return limit ? matches.slice(0, limit) : matches;
}
