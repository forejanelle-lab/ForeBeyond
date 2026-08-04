import { buildBrandSystemPrompt } from "@/lib/social-media/brand";
import { openAiChatJson } from "@/lib/social-media/openai";
import { distributePublishDates } from "@/lib/social-media/schedule";
import type {
  ContentStrategyWeek,
  GeneratedPostDraft,
  GenerateSocialContentInput,
  SocialMarketingGoal,
} from "@/lib/social-media/types";
import { SOCIAL_MARKETING_GOALS } from "@/lib/social-media/types";

function goalLabel(goal: SocialMarketingGoal): string {
  return SOCIAL_MARKETING_GOALS.find((g) => g.value === goal)?.label ?? goal;
}

export async function generateContentStrategy(
  input: GenerateSocialContentInput
): Promise<ContentStrategyWeek[]> {
  const result = await openAiChatJson<{ weeks: ContentStrategyWeek[] }>([
    { role: "system", content: buildBrandSystemPrompt() },
    {
      role: "user",
      content: `Create a 4-week Instagram content strategy for ${input.scheduleMonth}.
Marketing goal: ${goalLabel(input.goal)}
Theme: ${input.theme}
Tone: ${input.tone}
Additional instructions: ${input.additionalInstructions || "None"}

Return JSON: { "weeks": [ { "week": 1, "topic": "...", "focus": "..." }, ... ] }
Each week must have a distinct topic. Topics should diversify across destination inspiration, cultural education, hosting benefits, travel planning, community stories, and trust-first travel — aligned to the goal.`,
    },
  ]);

  return result.weeks?.length ? result.weeks : defaultStrategy(input.goal);
}

function defaultStrategy(goal: SocialMarketingGoal): ContentStrategyWeek[] {
  const destination =
    goal === "promote_japan"
      ? "Japan"
      : goal === "promote_italy"
        ? "Italy"
        : goal === "promote_spain"
          ? "Spain"
          : goal === "promote_guatemala"
            ? "Guatemala"
            : "global destinations";

  return [
    { week: 1, topic: "Destination Inspiration", focus: `Showcase ${destination} through authentic homestay moments` },
    { week: 2, topic: "Cultural Education", focus: "Daily life, food, and customs travelers discover with host families" },
    { week: 3, topic: "Hosting Benefits", focus: "Why local families love sharing their world with travelers" },
    { week: 4, topic: "Travel Planning", focus: "Trust-first tips for meaningful cultural immersion travel" },
  ];
}

export async function generatePostDrafts(
  input: GenerateSocialContentInput,
  strategy: ContentStrategyWeek[]
): Promise<GeneratedPostDraft[]> {
  const scheduleDates = distributePublishDates(input.postCount, input.scheduleMonth);

  const result = await openAiChatJson<{ posts: Omit<GeneratedPostDraft, "scheduled_at">[] }>([
    { role: "system", content: buildBrandSystemPrompt() },
    {
      role: "user",
      content: `Generate exactly ${input.postCount} unique Instagram post drafts for Fore Beyond.

Marketing goal: ${goalLabel(input.goal)}
Theme: ${input.theme}
Tone: ${input.tone}
Month: ${input.scheduleMonth}
Additional instructions: ${input.additionalInstructions || "None"}

Content strategy weeks:
${strategy.map((w) => `Week ${w.week}: ${w.topic} — ${w.focus}`).join("\n")}

Requirements for EACH post:
- caption: 100-180 words, warm and authentic, subtle CTA at end
- hashtags: exactly 5 strings without # prefix
- image_prompt: detailed photorealistic editorial travel photo description
- theme: short label
- strategy_week: 1-4
- strategy_topic: match the weekly strategy topic

Diversify topics, angles, and hashtags. Avoid repetitive openings.

Return JSON: { "posts": [ { "caption", "hashtags", "image_prompt", "theme", "strategy_week", "strategy_topic" }, ... ] }`,
    },
  ]);

  const posts = result.posts ?? [];
  if (posts.length === 0) {
    throw new Error("AI did not return any posts.");
  }

  return posts.slice(0, input.postCount).map((post, index) => ({
    ...post,
    hashtags: normalizeHashtags(post.hashtags),
    scheduled_at: scheduleDates[index] ?? scheduleDates[scheduleDates.length - 1]!,
  }));
}

export async function regenerateCaption(input: {
  goal: string | null;
  theme: string | null;
  tone: string | null;
  imagePrompt: string | null;
  currentCaption?: string;
}): Promise<{ caption: string; hashtags: string[] }> {
  const result = await openAiChatJson<{ caption: string; hashtags: string[] }>([
    { role: "system", content: buildBrandSystemPrompt() },
    {
      role: "user",
      content: `Rewrite this Instagram caption for Fore Beyond.
Goal: ${input.goal ?? "brand awareness"}
Theme: ${input.theme ?? "cultural travel"}
Tone: ${input.tone ?? "Warm & Authentic"}
Image context: ${input.imagePrompt ?? "Editorial travel photography"}
${input.currentCaption ? `Current caption to improve:\n${input.currentCaption}` : ""}

Return JSON: { "caption": "...", "hashtags": ["...", "...", "...", "...", "..."] }`,
    },
  ]);

  return {
    caption: result.caption,
    hashtags: normalizeHashtags(result.hashtags),
  };
}

export async function regenerateImagePrompt(input: {
  caption: string;
  theme: string | null;
  goal: string | null;
}): Promise<string> {
  const result = await openAiChatJson<{ image_prompt: string }>([
    { role: "system", content: buildBrandSystemPrompt() },
    {
      role: "user",
      content: `Create a new photorealistic Instagram image prompt for this post.
Caption: ${input.caption}
Theme: ${input.theme ?? ""}
Goal: ${input.goal ?? ""}

Return JSON: { "image_prompt": "..." }`,
    },
  ]);

  return result.image_prompt;
}

function normalizeHashtags(tags: string[] | undefined): string[] {
  const cleaned = (tags ?? [])
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean);
  return cleaned.slice(0, 5);
}
