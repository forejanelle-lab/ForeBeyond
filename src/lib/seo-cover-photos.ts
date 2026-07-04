import type { SupabaseClient } from "@supabase/supabase-js";

type CoverPhotoRow = {
  listing_id?: string;
  experience_id?: string;
  file_url: string;
  is_cover: boolean;
  sort_order: number;
};

function pickCoverUrl(rows: CoverPhotoRow[], idKey: "listing_id" | "experience_id", id: string) {
  const matches = rows.filter((row) => row[idKey] === id);
  const cover = matches.find((row) => row.is_cover);
  if (cover) return cover.file_url;
  return matches.sort((a, b) => a.sort_order - b.sort_order)[0]?.file_url ?? null;
}

export async function getListingCoverPhotoUrl(
  supabase: SupabaseClient,
  listingId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("listing_photos")
    .select("listing_id, file_url, is_cover, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (!data?.length) return null;
  return pickCoverUrl(data as CoverPhotoRow[], "listing_id", listingId);
}

export async function getExperienceCoverPhotoUrl(
  supabase: SupabaseClient,
  experienceId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("experience_photos")
    .select("experience_id, file_url, is_cover, sort_order")
    .eq("experience_id", experienceId)
    .order("sort_order");

  if (!data?.length) return null;
  return pickCoverUrl(data as CoverPhotoRow[], "experience_id", experienceId);
}

export async function getListingCoverPhotoMap(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Record<string, string>> {
  if (listingIds.length === 0) return {};

  const { data: photos } = await supabase
    .from("listing_photos")
    .select("listing_id, file_url, is_cover, sort_order")
    .in("listing_id", listingIds)
    .order("sort_order");

  const coverMap: Record<string, string> = {};
  for (const id of listingIds) {
    const url = pickCoverUrl((photos as CoverPhotoRow[] | null) ?? [], "listing_id", id);
    if (url) coverMap[id] = url;
  }
  return coverMap;
}
