import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { publishSocialPost } from "@/lib/social-media/publish";
import type { SocialPost } from "@/lib/social-media/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/** Publishes due scheduled Instagram posts. Call from Vercel Cron or manual trigger. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: duePosts, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("platform", "instagram")
    .eq("status", "scheduled")
    .eq("approved", true)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: SocialPost[] = [];
  for (const post of (duePosts as SocialPost[]) ?? []) {
    results.push(await publishSocialPost(supabase, post));
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    posts: results.map((p) => ({ id: p.id, status: p.status, publish_error: p.publish_error })),
  });
}
