import {
  GET_TO_KNOW_QUESTIONS,
  getGetToKnowOption,
  type GetToKnowInterestId,
} from "@/lib/get-to-know/questions";

export interface GetToKnowHostProfile {
  firstName: string | null;
  location: string | null;
  familyStory: string | null;
  stayDetails: string | null;
  hostMotivation: string | null;
  localRecommendations: string | null;
  meals: string[];
  familyActivities: string[];
  culturalOfferings: string[];
  conversationTopics: string[];
  languages: string[];
  amenities: string[];
}

export type GetToKnowAnswers = Record<string, string>;

export interface SharedInterestMatch {
  interestId: GetToKnowInterestId;
  label: string;
  evidence: string;
  source: string;
}

interface HostField {
  source: string;
  text: string;
}

function hostFields(host: GetToKnowHostProfile): HostField[] {
  const listFields: Array<{ source: string; items: string[] }> = [
    { source: "activities they share", items: host.familyActivities },
    { source: "cultural offerings", items: host.culturalOfferings },
    { source: "conversation topics", items: host.conversationTopics },
    { source: "meals", items: host.meals },
    { source: "languages", items: host.languages },
    { source: "the home", items: host.amenities },
  ];

  const prose: HostField[] = [
    { source: "their family story", text: host.familyStory ?? "" },
    { source: "why they host", text: host.hostMotivation ?? "" },
    { source: "stay details", text: host.stayDetails ?? "" },
    { source: "local recommendations", text: host.localRecommendations ?? "" },
  ]
    .map((field) => ({ ...field, text: field.text.trim() }))
    .filter((field) => field.text.length > 0);

  const fromLists: HostField[] = listFields.flatMap(({ source, items }) =>
    items
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => ({ source, text }))
  );

  return [...fromLists, ...prose];
}

function fieldMatchesKeyword(text: string, keyword: string) {
  const haystack = text.toLowerCase();
  const needle = keyword.toLowerCase();
  if (needle.length < 3) return haystack.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}[a-z]*`, "i").test(haystack);
}

function snippet(text: string, max = 140) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

function findEvidence(host: GetToKnowHostProfile, keywords: string[]): HostField | null {
  const fields = hostFields(host);
  for (const keyword of keywords) {
    for (const field of fields) {
      if (fieldMatchesKeyword(field.text, keyword)) return field;
    }
  }
  return null;
}

export function matchSharedInterests(
  answers: GetToKnowAnswers,
  host: GetToKnowHostProfile
): SharedInterestMatch[] {
  const matches: SharedInterestMatch[] = [];
  const seen = new Set<string>();

  for (const question of GET_TO_KNOW_QUESTIONS) {
    const optionId = answers[question.id];
    if (!optionId) continue;
    const option = getGetToKnowOption(question.id, optionId);
    if (!option) continue;
    if (seen.has(option.interest.id)) continue;

    const evidence = findEvidence(host, option.keywords);
    if (!evidence) continue;

    seen.add(option.interest.id);
    matches.push({
      interestId: option.interest.id,
      label: option.interest.label,
      evidence: snippet(evidence.text),
      source: evidence.source,
    });
  }

  return matches;
}

export function answeredInterestIds(answers: GetToKnowAnswers): GetToKnowInterestId[] {
  const ids: GetToKnowInterestId[] = [];
  for (const question of GET_TO_KNOW_QUESTIONS) {
    const optionId = answers[question.id];
    if (!optionId) continue;
    const option = getGetToKnowOption(question.id, optionId);
    if (option && !ids.includes(option.interest.id)) ids.push(option.interest.id);
  }
  return ids;
}

export function buildOpeningMessage(input: {
  hostName: string;
  location: string | null;
  matches: SharedInterestMatch[];
  prompt: string;
}) {
  const name = input.hostName.trim() || "there";
  const shared = input.matches.slice(0, 2).map((match) => match.label.toLowerCase());
  const place = input.location?.trim();
  const placeClause = place ? ` while visiting ${place}` : "";

  if (shared.length > 0) {
    const sharedPhrase =
      shared.length === 1 ? shared[0] : `${shared[0]} and ${shared[1]}`;
    return `Hi ${name}! I noticed we both seem to enjoy ${sharedPhrase}. ${input.prompt.replace(/\?$/, "")}${placeClause}?`;
  }

  return `Hi ${name}! I'd love to get to know you a little before considering a stay. ${input.prompt}`;
}

export function hostProfileFromListing(listing: {
  family_story?: string | null;
  stay_details?: string | null;
  host_motivation?: string | null;
  local_recommendations?: string | null;
  meals?: string[] | null;
  family_activities?: string[] | null;
  cultural_offerings?: string[] | null;
  conversation_topics?: string[] | null;
  languages?: string[] | null;
  amenities?: string[] | null;
  city?: string | null;
  country?: string | null;
  host_first_name?: string | null;
}): GetToKnowHostProfile {
  return {
    firstName: listing.host_first_name ?? null,
    location: [listing.city, listing.country].filter(Boolean).join(", ") || null,
    familyStory: listing.family_story ?? null,
    stayDetails: listing.stay_details ?? null,
    hostMotivation: listing.host_motivation ?? null,
    localRecommendations: listing.local_recommendations ?? null,
    meals: listing.meals ?? [],
    familyActivities: listing.family_activities ?? [],
    culturalOfferings: listing.cultural_offerings ?? [],
    conversationTopics: listing.conversation_topics ?? [],
    languages: listing.languages ?? [],
    amenities: listing.amenities ?? [],
  };
}
