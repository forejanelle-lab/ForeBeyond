import type { HostFinderHostType, HostSignalIntent } from "@/lib/host-finder/types";

export interface SignalPhrase {
  phrase: string;
  intent_level: HostSignalIntent;
  category: string;
}

/** Default signals — also seeded in DB migration. */
export const DEFAULT_SIGNALS: SignalPhrase[] = [
  { phrase: "I hosted an exchange student", intent_level: "high", category: "hosting_experience" },
  { phrase: "we hosted an exchange student", intent_level: "high", category: "hosting_experience" },
  { phrase: "we hosted", intent_level: "high", category: "hosting_experience" },
  { phrase: "I'd host again", intent_level: "high", category: "hosting_intent" },
  { phrase: "I would host again", intent_level: "high", category: "hosting_intent" },
  { phrase: "we loved hosting", intent_level: "high", category: "hosting_experience" },
  { phrase: "hosting exchange students", intent_level: "high", category: "hosting_experience" },
  { phrase: "hosting international students", intent_level: "high", category: "hosting_experience" },
  { phrase: "our exchange student", intent_level: "high", category: "hosting_experience" },
  { phrase: "our host student", intent_level: "high", category: "hosting_experience" },
  { phrase: "we still keep in touch", intent_level: "high", category: "hosting_experience" },
  { phrase: "looking to host", intent_level: "high", category: "hosting_intent" },
  { phrase: "interested in hosting", intent_level: "high", category: "hosting_intent" },
  { phrase: "hosted international students", intent_level: "high", category: "hosting_experience" },
  { phrase: "hosted international visitors", intent_level: "high", category: "hosting_experience" },
  { phrase: "cultural exchange", intent_level: "medium", category: "cultural" },
  { phrase: "homestay", intent_level: "medium", category: "accommodation" },
  { phrase: "international students", intent_level: "medium", category: "cultural" },
  { phrase: "international visitors", intent_level: "medium", category: "cultural" },
  { phrase: "love meeting people from other countries", intent_level: "medium", category: "cultural" },
  { phrase: "spare bedroom", intent_level: "medium", category: "accommodation" },
  { phrase: "extra bedroom", intent_level: "medium", category: "accommodation" },
  { phrase: "cultural immersion", intent_level: "medium", category: "cultural" },
  { phrase: "study abroad", intent_level: "medium", category: "cultural" },
  { phrase: "exchange student", intent_level: "medium", category: "cultural" },
];

const HOST_TYPE_TERMS: Record<HostFinderHostType, string[]> = {
  experienced_cultural_exchange_host: [
    "hosted exchange student",
    "host family cultural exchange",
    "would host again exchange student",
  ],
  homestay_host: [
    "homestay host family",
    "host international visitors homestay",
    "spare bedroom homestay",
  ],
  language_teacher: [
    "language teacher host family",
    "ESL host family",
    "host international students language",
  ],
  general: [
    "host international travelers",
    "cultural exchange host family",
    "interested in hosting visitors",
  ],
};

export function buildSearchTerms(
  signals: SignalPhrase[],
  hostType: HostFinderHostType,
  maxTerms = 10
): string[] {
  const high = signals.filter((s) => s.intent_level === "high").map((s) => s.phrase);
  const medium = signals.filter((s) => s.intent_level === "medium").map((s) => s.phrase);
  const typeTerms = HOST_TYPE_TERMS[hostType] ?? [];

  const combined = [...typeTerms, ...high.slice(0, 6), ...medium.slice(0, 4)];
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const term of combined) {
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(term);
    if (unique.length >= maxTerms) break;
  }

  return unique;
}
