import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import {
  generateContentStrategy,
  generatePostDrafts,
} from "@/lib/social-media/generate-content";
import { generateEditorialImage, mapWithConcurrency } from "@/lib/social-media/openai";
import { reviewAndImprovePosts } from "@/lib/social-media/review-posts";
import { uploadSocialImageWithService } from "@/lib/social-media/storage";
import type { GenerateSocialContentInput, SocialPost } from "@/lib/social-media/types";
import { SOCIAL_POST_COUNTS } from "@/lib/social-media/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Partial<GenerateSocialContentInput>;
  const postCount = Number(body.postCount);
  if (!SOCIAL_POST_COUNTS.includes(postCount as (typeof SOCIAL_POST_COUNTS)[number])) {
    return NextResponse.json({ error: "Invalid post count." }, { status: 400 });
  }

  if (!body.goal || !body.theme?.trim() || !body.tone?.trim() || !body.scheduleMonth?.trim()) {
    return NextResponse.json({ error: "Missing required generation fields." }, { status: 400 });
  }

  const input: GenerateSocialContentInput = {
    postCount,
    goal: body.goal,
    theme: body.theme.trim(),
    tone: body.tone.trim(),
    scheduleMonth: body.scheduleMonth.trim(),
    additionalInstructions: body.additionalInstructions?.trim(),
  };

  try {
    const strategy = await generateContentStrategy(input);
    let drafts = await generatePostDrafts(input, strategy);
    drafts = await reviewAndImprovePosts(drafts);

    const rows = drafts.map((draft) => ({
      platform: "instagram" as const,
      image_prompt: draft.image_prompt,
      caption: draft.caption,
      hashtags: draft.hashtags,
      theme: draft.theme,
      goal: input.goal,
      tone: input.tone,
      strategy_week: draft.strategy_week,
      strategy_topic: draft.strategy_topic,
      scheduled_at: draft.scheduled_at,
      status: "draft" as const,
      approved: false,
      created_by: auth.user.id,
    }));

    const { data: inserted, error: insertError } = await auth.supabase
      .from("social_posts")
      .insert(rows)
      .select("*");

    if (insertError || !inserted?.length) {
      throw new Error(insertError?.message ?? "Failed to save generated posts.");
    }

    const postsWithImages = await mapWithConcurrency(
      inserted as SocialPost[],
      2,
      async (post) => {
        if (!post.image_prompt) return post;
        try {
          const buffer = await generateEditorialImage(post.image_prompt);
          const imageUrl = await uploadSocialImageWithService(post.id, buffer, "image/png");
          const { data, error } = await auth.supabase
            .from("social_posts")
            .update({ image_url: imageUrl })
            .eq("id", post.id)
            .select("*")
            .single();
          if (error) throw error;
          return data as SocialPost;
        } catch (imageError) {
          console.error(`Image generation failed for post ${post.id}:`, imageError);
          return post;
        }
      }
    );

    return NextResponse.json({
      ok: true,
      strategy,
      posts: postsWithImages,
    });
  } catch (err) {
    console.error("Social content generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 500 }
    );
  }
}
