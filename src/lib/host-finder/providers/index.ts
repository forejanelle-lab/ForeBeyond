import type { SearchProvider, SearchQuery, SearchResultItem } from "@/lib/host-finder/providers/types";
import { inferSourceType } from "@/lib/host-finder/source-type";

function buildLocationQuery(query: SearchQuery): string {
  if (query.region?.trim()) {
    return `${query.region.trim()}, ${query.country.trim()}`;
  }
  return query.country.trim();
}

function dedupeResults(items: SearchResultItem[]): SearchResultItem[] {
  const seen = new Set<string>();
  const out: SearchResultItem[] = [];
  for (const item of items) {
    const key = item.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export class SerperSearchProvider implements SearchProvider {
  readonly name = "serper";

  constructor(private apiKey: string) {}

  async search(query: SearchQuery, searchTerms: string[]): Promise<SearchResultItem[]> {
    const location = buildLocationQuery(query);
    const resultsPerTerm = Math.ceil((query.leadsRequested * 3) / Math.max(searchTerms.length, 1));
    const all: SearchResultItem[] = [];

    for (const term of searchTerms) {
      const q = `"${term}" ${location}`;
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q, num: Math.min(resultsPerTerm, 20) }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Serper search failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as {
        organic?: { title?: string; link?: string; snippet?: string; date?: string }[];
      };

      for (const row of data.organic ?? []) {
        if (!row.link || !row.title) continue;
        all.push({
          title: row.title,
          url: row.link,
          snippet: row.snippet ?? "",
          sourceType: inferSourceType(row.link),
          publishedAt: row.date,
        });
      }
    }

    return dedupeResults(all);
  }
}

export class TavilySearchProvider implements SearchProvider {
  readonly name = "tavily";

  constructor(private apiKey: string) {}

  async search(query: SearchQuery, searchTerms: string[]): Promise<SearchResultItem[]> {
    const location = buildLocationQuery(query);
    const all: SearchResultItem[] = [];

    for (const term of searchTerms.slice(0, 8)) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: `${term} ${location}`,
          search_depth: "basic",
          max_results: Math.min(10, query.leadsRequested),
          include_answer: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Tavily search failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as {
        results?: { title?: string; url?: string; content?: string; published_date?: string }[];
      };

      for (const row of data.results ?? []) {
        if (!row.url || !row.title) continue;
        all.push({
          title: row.title,
          url: row.url,
          snippet: row.content ?? "",
          sourceType: inferSourceType(row.url),
          publishedAt: row.published_date,
        });
      }
    }

    return dedupeResults(all);
  }
}

/** Development fallback when no search API is configured. */
export class MockSearchProvider implements SearchProvider {
  readonly name = "mock";

  async search(query: SearchQuery, _searchTerms: string[]): Promise<SearchResultItem[]> {
    const location = query.region ? `${query.region}, ${query.country}` : query.country;
    const samples: SearchResultItem[] = [
      {
        title: `r/homestay — hosting and cultural exchange in ${location}`,
        url: "https://www.reddit.com/r/homestay/",
        snippet:
          "We hosted three exchange students over the past five years and would love to host again. Our kids loved the cultural exchange.",
        sourceType: "reddit",
      },
      {
        title: `r/ExchangeStudents — host families in ${location}`,
        url: "https://www.reddit.com/r/ExchangeStudents/",
        snippet:
          "After hosting two international students, we found it incredibly rewarding. We have a spare bedroom and are interested in hosting again.",
        sourceType: "reddit",
      },
      {
        title: `Homestay — Wikipedia`,
        url: "https://en.wikipedia.org/wiki/Homestay",
        snippet:
          "A homestay is a popular form of hospitality and lodging whereby visitors share a residence with a local of the city to which they are traveling.",
        sourceType: "web",
      },
    ];

    return samples.slice(0, Math.min(query.leadsRequested, 3));
  }
}

export function createSearchProvider(): SearchProvider {
  const provider = (process.env.HOST_FINDER_SEARCH_PROVIDER ?? "mock").trim().toLowerCase();
  const apiKey = process.env.HOST_FINDER_SEARCH_API_KEY?.trim();

  if (provider === "serper") {
    if (!apiKey) throw new Error("HOST_FINDER_SEARCH_API_KEY is required for Serper.");
    return new SerperSearchProvider(apiKey);
  }

  if (provider === "tavily") {
    if (!apiKey) throw new Error("HOST_FINDER_SEARCH_API_KEY is required for Tavily.");
    return new TavilySearchProvider(apiKey);
  }

  if (provider === "mock") {
    return new MockSearchProvider();
  }

  throw new Error(`Unknown HOST_FINDER_SEARCH_PROVIDER: ${provider}`);
}

export function isSearchProviderConfigured(): boolean {
  const provider = (process.env.HOST_FINDER_SEARCH_PROVIDER ?? "mock").trim().toLowerCase();
  if (provider === "mock") return true;
  return Boolean(process.env.HOST_FINDER_SEARCH_API_KEY?.trim());
}

export function getSearchProviderLabel(): string {
  return (process.env.HOST_FINDER_SEARCH_PROVIDER ?? "mock").trim().toLowerCase();
}
