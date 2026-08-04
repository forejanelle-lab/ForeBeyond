import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { regenerateCaption, regenerateImagePrompt } from "@/lib/social-media/generate-content";
import { generateEditorialImage } from "@/lib/social-media/openai";
import { uploadSocialImageWithService } from "@/lib/social-media/storage";
import type { SocialPost } from "@/lib/social-media/types";

export const maxDuration = 120;
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
    const imagePrompt =
      typed.image_prompt ??
      (await regenerateImagePrompt({
        caption: typed.caption,
        theme: typed.theme,
        goal: typed.goal,
      }));

    const buffer = await generateEditorialImage(imagePrompt);
    const imageUrl = await uploadSocialImageWithService(typed.id, buffer, "image/png");

    const { data: updated, error: updateError } = await auth.supabase
      .from("social_posts")
      .update({
        image_url: imageUrl,
        image_prompt: imagePrompt,
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
      { error: err instanceof Error ? err.message : "Image regeneration failed." },
      { status: 500 }
    );
  }
}
