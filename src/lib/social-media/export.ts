import type { SocialPost } from "@/lib/social-media/types";

export function formatSocialPostCaption(post: Pick<SocialPost, "caption" | "hashtags">): string {
  const tags = (post.hashtags ?? []).map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ");
  if (!tags) return post.caption.trim();
  return `${post.caption.trim()}\n\n${tags}`.trim();
}

export async function copySocialPostCaption(post: Pick<SocialPost, "caption" | "hashtags">): Promise<void> {
  await navigator.clipboard.writeText(formatSocialPostCaption(post));
}

export async function downloadSocialPostImage(
  post: Pick<SocialPost, "id" | "image_url">
): Promise<void> {
  if (!post.image_url) {
    throw new Error("This post has no image to download.");
  }

  const extension = post.image_url.match(/\.(jpe?g|png|webp)(\?|$)/i)?.[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `forebeyond-instagram-${post.id.slice(0, 8)}.${extension}`;

  try {
    const response = await fetch(post.image_url);
    if (!response.ok) throw new Error("Download failed.");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement("a");
    link.href = post.image_url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }
}
