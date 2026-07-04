export function hostListingPath(listingId: string): string {
  return `/families/${listingId}`;
}

export function hostListingSignInPath(listingId: string): string {
  return `/auth/sign-in?redirect=${encodeURIComponent(hostListingPath(listingId))}`;
}
