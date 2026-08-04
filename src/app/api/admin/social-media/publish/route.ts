import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { publishSocialPost } from "@/lib/social-media/publish";
import type { SocialPost } from "@/lib/social-media/types";

export const maxDuration = 60;
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

  if (!typed.approved && typed.status !== "failed") {
    return NextResponse.json(
      { error: "Approve the post before publishing." },
      { status: 400 }
    );
  }

  try {
    const updated = await publishSocialPost(auth.supabase, typed);
    return NextResponse.json({ ok: true, post: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed." },
      { status: 500 }
    );
  }
}
