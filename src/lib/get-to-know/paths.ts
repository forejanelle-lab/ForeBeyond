import { hostListingPath } from "@/lib/listing-access";

export function hostListingGetToKnowPath(listingId: string) {
  return `${hostListingPath(listingId)}/get-to-know`;
}

export function stayRequestWithIntroPath(listingId: string, intro: string) {
  const params = new URLSearchParams();
  if (intro.trim()) params.set("intro", intro.trim());
  const query = params.toString();
  return `${hostListingPath(listingId)}/request${query ? `?${query}` : ""}`;
}

export function conversationDraftPath(conversationId: string, draft: string) {
  const params = new URLSearchParams();
  if (draft.trim()) params.set("draft", draft.trim());
  const query = params.toString();
  return `/messages/${conversationId}${query ? `?${query}` : ""}`;
}
