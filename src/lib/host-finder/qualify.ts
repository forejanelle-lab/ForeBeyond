import { openAiChatJson, mapWithConcurrency } from "@/lib/social-media/openai";
import type { SearchResultItem } from "@/lib/host-finder/providers/types";
import {
  priorityFromScore,
  type HostFinderHostType,
  type HostLeadPriority,
  type HostLeadScoreExplanation,
} from "@/lib/host-finder/types";

export interface QualificationInput {
  result: SearchResultItem;
  targetCountry: string;
  targetRegion?: string;
  hostType: HostFinderHostType;
}

export interface QualificationResult {
  isLegitimateLead: boolean;
  name: string;
  email: string | null;
  country: string | null;
  region: string | null;
  score: number;
  priority: HostLeadPriority;
  evidenceExcerpt: string;
  whyGoodFit: string[];
  hostExperience: string | null;
  potentialConcerns: string[];
  recommendedApproach: string | null;
  scoreExplanation: HostLeadScoreExplanation;
  suggestedTags: string[];
}

interface AiQualificationResponse {
  is_legitimate_lead: boolean;
  name: string;
  email: string | null;
  country: string | null;
  region: string | null;
  score: number;
  evidence_excerpt: string;
  why_good_fit: string[];
  host_experience: string | null;
  potential_concerns: string[];
  recommended_approach: string | null;
  confirmed_evidence: string[];
  reasonable_inference: string[];
  unknown: string[];
  summary: string;
  suggested_tags: string[];
}

const QUALIFICATION_SYSTEM = `You are a lead qualification assistant for Fore Beyond, a platform connecting travelers with host families for cultural exchange stays.

Your job is to evaluate publicly available web search results and determine if they represent a legitimate potential HOST (an individual or family who might host international travelers), NOT an organization recruiting hosts unless explicitly relevant.

CRITICAL RULES:
- NEVER invent facts about a person. Only use information present in the provided title, URL, and snippet.
- NEVER infer sensitive personal characteristics (race, religion, politics, health, etc.).
- NEVER claim someone is a host unless the source supports that conclusion.
- Clearly distinguish confirmed evidence vs reasonable inference vs unknown in your reasoning.
- If the result is an organization, news article, or unrelated content, set is_legitimate_lead to false and score below 50.
- If you cannot identify an individual name, use a descriptive label like "Reddit user" or "Blog author" — never fabricate a full name.
- Score 0-100 based on: previous hosting experience, current hosting activity, explicit desire to host again, cultural exchange interest, spare room mentions, hospitality experience, location match, individual vs organization, evidence strength and recency.
- Only include email if it literally appears in the snippet.

Respond with valid JSON matching the requested schema.`;

export async function qualifySearchResult(
  input: QualificationInput
): Promise<QualificationResult> {
  const { result, targetCountry, targetRegion, hostType } = input;

  const userPrompt = `Evaluate this search result as a potential Fore Beyond host lead.

Target location: ${targetRegion ? `${targetRegion}, ` : ""}${targetCountry}
Target host type: ${hostType}

Source URL: ${result.url}
Source type: ${result.sourceType}
Title: ${result.title}
Snippet: ${result.snippet}
${result.publishedAt ? `Published: ${result.publishedAt}` : ""}

Return JSON with these fields:
{
  "is_legitimate_lead": boolean,
  "name": string,
  "email": string | null,
  "country": string | null,
  "region": string | null,
  "score": number (0-100),
  "evidence_excerpt": string (quote or paraphrase ONLY from the snippet),
  "why_good_fit": string[],
  "host_experience": string | null,
  "potential_concerns": string[],
  "recommended_approach": string | null,
  "confirmed_evidence": string[],
  "reasonable_inference": string[],
  "unknown": string[],
  "summary": string,
  "suggested_tags": string[]
}`;

  const ai = await openAiChatJson<AiQualificationResponse>(
    [
      { role: "system", content: QUALIFICATION_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    "gpt-4o-mini"
  );

  const score = Math.max(0, Math.min(100, Math.round(ai.score ?? 0)));
  const priority = priorityFromScore(score);

  return {
    isLegitimateLead: Boolean(ai.is_legitimate_lead) && score >= 40,
    name: ai.name?.trim() || "Unknown prospect",
    email: ai.email?.trim() || null,
    country: ai.country?.trim() || null,
    region: ai.region?.trim() || null,
    score,
    priority,
    evidenceExcerpt: ai.evidence_excerpt?.trim() || result.snippet.slice(0, 500),
    whyGoodFit: ai.why_good_fit ?? [],
    hostExperience: ai.host_experience?.trim() || null,
    potentialConcerns: ai.potential_concerns ?? [],
    recommendedApproach: ai.recommended_approach?.trim() || null,
    scoreExplanation: {
      confirmed_evidence: ai.confirmed_evidence ?? [],
      reasonable_inference: ai.reasonable_inference ?? [],
      unknown: ai.unknown ?? [],
      summary: ai.summary?.trim() || "",
    },
    suggestedTags: ai.suggested_tags ?? [],
  };
}

export async function qualifySearchResults(
  items: SearchResultItem[],
  targetCountry: string,
  targetRegion: string | undefined,
  hostType: HostFinderHostType,
  concurrency = 3
): Promise<{ result: SearchResultItem; qualification: QualificationResult }[]> {
  return mapWithConcurrency(items, concurrency, async (result) => {
    const qualification = await qualifySearchResult({
      result,
      targetCountry,
      targetRegion,
      hostType,
    });
    return { result, qualification };
  });
}
