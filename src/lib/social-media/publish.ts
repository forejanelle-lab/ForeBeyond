import type { SupabaseClient } from "@supabase/supabase-js";
import { publishToInstagramWithClient } from "@/lib/social-media/instagram";
import type { SocialPost } from "@/lib/social-media/types";

export async function publishSocialPost(
  supabase: SupabaseClient,
  post: SocialPost
): Promise<SocialPost> {
  try {
    const { mediaId } = await publishToInstagramWithClient(supabase, post);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: "published",
        published_at: now,
        publish_error: null,
        platform_media_id: mediaId,
        platform_data: { instagram_media_id: mediaId },
      })
      .eq("id", post.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as SocialPost;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: "failed",
        publish_error: message,
      })
      .eq("id", post.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as SocialPost;
  }
}

export async function approveSocialPost(
  supabase: SupabaseClient,
  postId: string
): Promise<SocialPost> {
  const { data: existing, error: fetchError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Post not found.");
  }

  const post = existing as SocialPost;
  const { data, error } = await supabase
    .from("social_posts")
    .update({
      approved: true,
      status: "scheduled",
      scheduled_at: post.scheduled_at ?? new Date().toISOString(),
    })
    .eq("id", postId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as SocialPost;
}
