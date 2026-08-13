import { openAiChatJson } from "@/lib/social-media/openai";
import type { HostLead, HostLeadSource } from "@/lib/host-finder/types";
import { sourceTypeLabel } from "@/lib/host-finder/source-type";

interface OutreachResponse {
  message: string;
}

const OUTREACH_SYSTEM = `You write short, warm, personalized outreach messages for Fore Beyond — a platform connecting travelers with host families for authentic cultural exchange stays.

RULES:
- Use ONLY information supported by the provided evidence. Never invent details.
- Keep messages natural, friendly, and under 150 words.
- Do NOT mention scraping, stalking, or extensive online research.
- Do NOT say "I saw everything you posted" or "I found you through your Facebook activity."
- Use natural phrasing like "I came across your experience hosting exchange students..."
- Do NOT be creepy or overly familiar.
- Include a brief intro to Fore Beyond and a soft invitation to learn more.
- Do NOT include a subject line unless asked — just the message body.
- The message is for manual sending by an admin — never imply it was auto-sent.

Respond with JSON: { "message": "..." }`;

export async function generateOutreachMessage(
  lead: Pick<
    HostLead,
    | "name"
    | "evidence_excerpt"
    | "why_good_fit"
    | "host_experience"
    | "recommended_approach"
    | "country"
    | "region"
  >,
  sources: Pick<HostLeadSource, "source_type" | "source_url" | "title">[]
): Promise<string> {
  const sourceSummary = sources
    .map((s) => `${sourceTypeLabel(s.source_type)}: ${s.title ?? s.source_url}`)
    .join("\n");

  const userPrompt = `Write a personalized outreach message for this potential host lead.

Name/label: ${lead.name}
Location: ${lead.region ? `${lead.region}, ` : ""}${lead.country ?? "Unknown"}

Evidence excerpt:
${lead.evidence_excerpt ?? "No excerpt available."}

Host experience (if known):
${lead.host_experience ?? "Unknown"}

Why they may be a fit:
${(lead.why_good_fit ?? []).map((w) => `- ${w}`).join("\n") || "—"}

Recommended approach:
${lead.recommended_approach ?? "Personalized, warm introduction"}

Public sources (for context only — do not mention scraping):
${sourceSummary || "—"}`;

  const ai = await openAiChatJson<OutreachResponse>(
    [
      { role: "system", content: OUTREACH_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    "gpt-4o-mini"
  );

  return ai.message?.trim() || "";
}
