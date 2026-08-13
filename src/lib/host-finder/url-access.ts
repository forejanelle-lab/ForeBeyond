import { mapWithConcurrency } from "@/lib/social-media/openai";
import type { HostLeadSource, HostLeadWithSources } from "@/lib/host-finder/types";

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Sites that often block server fetches but work in a browser. */
const BOT_BLOCKED_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
]);

function isPlaceholderUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (/^example\.(com|org|net)$/.test(host)) return true;
    if (host.includes("example") && !host.includes("wordpress")) return true;
    if (/example\d/i.test(parsed.pathname)) return true;
    if (/\/example\b/i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return true;
  }
}

function hostMatchesSet(hostname: string, hosts: Set<string>): boolean {
  const h = hostname.toLowerCase();
  if (hosts.has(h)) return true;
  for (const host of hosts) {
    if (h.endsWith(`.${host}`)) return true;
  }
  return false;
}

async function fetchWithTimeout(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isSuccessStatus(status: number, hostname: string): boolean {
  if (status === 404 || status === 410) return false;
  if (status >= 200 && status < 400) return true;
  if (
    (status === 403 || status === 401) &&
    hostMatchesSet(hostname, BOT_BLOCKED_HOSTS)
  ) {
    return true;
  }
  return false;
}

/** Returns true when the URL resolves and is not a known placeholder or dead link. */
export async function isSourceUrlAccessible(url: string): Promise<boolean> {
  if (!url?.trim() || isPlaceholderUrl(url)) return false;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  try {
    let response = await fetchWithTimeout(parsed.toString(), "HEAD");

    if (response.status === 405) {
      response = await fetchWithTimeout(parsed.toString(), "GET");
    }

    if (isSuccessStatus(response.status, parsed.hostname)) return true;

    if ([403, 401, 500, 502, 503].includes(response.status)) {
      const getRes = await fetchWithTimeout(parsed.toString(), "GET");
      return isSuccessStatus(getRes.status, parsed.hostname);
    }

    return false;
  } catch {
    return false;
  }
}

export async function filterAccessibleSources<T extends Pick<HostLeadSource, "source_url">>(
  sources: T[]
): Promise<T[]> {
  if (sources.length === 0) return [];

  const checked = await mapWithConcurrency(sources, 4, async (src) => ({
    src,
    ok: await isSourceUrlAccessible(src.source_url),
  }));

  return checked.filter((c) => c.ok).map((c) => c.src);
}

export async function withAccessibleSourcesForLeads(
  leads: HostLeadWithSources[]
): Promise<HostLeadWithSources[]> {
  if (leads.length === 0) return [];

  return mapWithConcurrency(leads, 3, async (lead) => ({
    ...lead,
    sources: await filterAccessibleSources(lead.sources),
  }));
}

export async function filterAccessibleSearchResults<T extends { url: string }>(
  results: T[]
): Promise<T[]> {
  if (results.length === 0) return [];

  const checked = await mapWithConcurrency(results, 5, async (item) => ({
    item,
    ok: await isSourceUrlAccessible(item.url),
  }));

  return checked.filter((c) => c.ok).map((c) => c.item);
}
