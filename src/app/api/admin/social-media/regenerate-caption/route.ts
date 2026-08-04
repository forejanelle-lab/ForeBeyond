import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { regenerateCaption } from "@/lib/social-media/generate-content";
import type { SocialPost } from "@/lib/social-media/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as { postId?: string };
  if (!body.postId) {
    return NextResponse.json({ error: "postId is required." }, { status: 400 });
  }

  const { data: post, error } = await auth.supabase
    .from("social_posts")
    .select("*")
    .eq("id", body.postId)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const typed = post as SocialPost;

  try {
    const result = await regenerateCaption({
      goal: typed.goal,
      theme: typed.theme,
      tone: typed.tone,
      imagePrompt: typed.image_prompt,
      currentCaption: typed.caption,
    });

    const { data: updated, error: updateError } = await auth.supabase
      .from("social_posts")
      .update({
        caption: result.caption,
        hashtags: result.hashtags,
        status: typed.status === "published" ? typed.status : "draft",
        approved: typed.status === "published" ? typed.approved : false,
      })
      .eq("id", typed.id)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ ok: true, post: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Caption regeneration failed." },
      { status: 500 }
    );
  }
}
