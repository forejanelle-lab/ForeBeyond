import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

export const SOCIAL_MEDIA_BUCKET = "social-media";

export async function uploadSocialImage(
  supabase: SupabaseClient,
  postId: string,
  imageBuffer: Buffer,
  contentType = "image/png"
): Promise<string> {
  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
  const path = `instagram/${postId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(SOCIAL_MEDIA_BUCKET)
    .upload(path, imageBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(SOCIAL_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadSocialImageWithService(
  postId: string,
  imageBuffer: Buffer,
  contentType = "image/png"
): Promise<string> {
  return uploadSocialImage(createServiceClient(), postId, imageBuffer, contentType);
}
