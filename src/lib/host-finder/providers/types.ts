import type { HostFinderHostType, HostLeadSourceType } from "@/lib/host-finder/types";

export interface SearchQuery {
  country: string;
  region?: string;
  hostType: HostFinderHostType;
  leadsRequested: number;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  sourceType: HostLeadSourceType;
  publishedAt?: string;
}

export interface SearchProvider {
  readonly name: string;
  search(query: SearchQuery, searchTerms: string[]): Promise<SearchResultItem[]>;
}

export interface SearchProviderConfig {
  provider: "serper" | "tavily" | "mock";
  apiKey?: string;
}
