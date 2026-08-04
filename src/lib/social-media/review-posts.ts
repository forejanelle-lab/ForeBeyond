import { buildBrandSystemPrompt } from "@/lib/social-media/brand";
import { openAiChatJson } from "@/lib/social-media/openai";
import type { GeneratedPostDraft } from "@/lib/social-media/types";

/** Second-pass AI review to reduce repetition and strengthen weak posts. */
export async function reviewAndImprovePosts(
  posts: GeneratedPostDraft[]
): Promise<GeneratedPostDraft[]> {
  if (posts.length === 0) return posts;

  const result = await openAiChatJson<{ posts: GeneratedPostDraft[] }>([
    { role: "system", content: buildBrandSystemPrompt() },
    {
      role: "user",
      content: `Review these ${posts.length} Instagram drafts for Fore Beyond.

Check for:
- repetitive topics or angles
- repetitive caption openings or phrasing
- repetitive hashtags across posts
- weak or salesy CTAs
- weak or generic image prompts

Improve any weak posts while keeping each post distinct. Preserve strategy_week, strategy_topic, and scheduled_at exactly.

Return JSON: { "posts": [ same shape as input ] }

Input posts:
${JSON.stringify(posts)}`,
    },
  ]);

  const improved = result.posts ?? posts;
  return improved.map((post, index) => ({
    ...post,
    scheduled_at: posts[index]?.scheduled_at ?? post.scheduled_at,
    hashtags: (post.hashtags ?? []).map((t) => t.replace(/^#+/, "")).slice(0, 5),
  }));
}
