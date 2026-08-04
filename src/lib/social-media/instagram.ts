import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveInstagramCredentials } from "@/lib/social-media/connection";
import type { InstagramCredentials, SocialPost } from "@/lib/social-media/types";

function formatInstagramCaption(post: Pick<SocialPost, "caption" | "hashtags">): string {
  const tags = post.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ");
  return `${post.caption.trim()}\n\n${tags}`.trim();
}

export async function publishToInstagram(
  post: SocialPost,
  credentials: InstagramCredentials
): Promise<{ mediaId: string }> {
  const { accessToken, businessAccountId } = credentials;

  if (!post.image_url) {
    throw new Error("Post is missing an image URL.");
  }

  const caption = formatInstagramCaption(post);
  const base = `https://graph.instagram.com/v21.0/${businessAccountId}`;

  const createParams = new URLSearchParams({
    image_url: post.image_url,
    caption,
    access_token: accessToken,
  });

  const createResponse = await fetch(`${base}/media`, {
    method: "POST",
    body: createParams,
  });

  const createData = (await createResponse.json()) as { id?: string; error?: { message?: string } };
  if (!createResponse.ok || !createData.id) {
    throw new Error(createData.error?.message ?? "Failed to create Instagram media container.");
  }

  const publishParams = new URLSearchParams({
    creation_id: createData.id,
    access_token: accessToken,
  });

  const publishResponse = await fetch(`${base}/media_publish`, {
    method: "POST",
    body: publishParams,
  });

  const publishData = (await publishResponse.json()) as { id?: string; error?: { message?: string } };
  if (!publishResponse.ok || !publishData.id) {
    throw new Error(publishData.error?.message ?? "Failed to publish Instagram media.");
  }

  return { mediaId: publishData.id };
}

export async function publishToInstagramWithClient(
  supabase: SupabaseClient,
  post: SocialPost
): Promise<{ mediaId: string }> {
  const credentials = await resolveInstagramCredentials(supabase);
  return publishToInstagram(post, credentials);
}

export { isInstagramConfigured, isInstagramConfiguredSync } from "@/lib/social-media/connection";
