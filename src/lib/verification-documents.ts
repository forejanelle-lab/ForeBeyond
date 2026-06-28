import type { SupabaseClient } from "@supabase/supabase-js";

export const VERIFICATION_BUCKET = "verification-documents";

export function isExternalVerificationUrl(fileUrl: string) {
  return fileUrl.startsWith("http://") || fileUrl.startsWith("https://");
}

export async function getVerificationDocumentViewUrl(
  supabase: SupabaseClient,
  fileUrl: string,
  expiresIn = 3600
): Promise<{ url: string | null; error: string | null }> {
  if (isExternalVerificationUrl(fileUrl)) {
    return { url: fileUrl, error: null };
  }

  const { data, error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(fileUrl, expiresIn);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

export function formatDocumentType(type: string) {
  return type.replace(/_/g, " ");
}
