import { createHash } from "crypto";
import type { QualificationResult } from "@/lib/host-finder/qualify";
import type { SearchResultItem } from "@/lib/host-finder/providers/types";

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    const path = parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.toLowerCase()}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
}

export function buildDedupKey(
  result: SearchResultItem,
  qualification: QualificationResult
): string {
  const urlKey = normalizeUrl(result.url);
  const nameKey = qualification.name.trim().toLowerCase().replace(/\s+/g, " ");
  const emailKey = qualification.email?.trim().toLowerCase() ?? "";

  const raw = [urlKey, nameKey, emailKey].filter(Boolean).join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 64);
}

export function mergeTags(existing: string[], incoming: string[]): string[] {
  const set = new Set<string>();
  for (const tag of [...existing, ...incoming]) {
    const trimmed = tag.trim();
    if (trimmed) set.add(trimmed);
  }
  return Array.from(set);
}

export function pickBetterScore(a: number, b: number): number {
  return Math.max(a, b);
}
