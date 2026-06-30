/** Per-host marketplace variety — reviews, verification tier, and rating mix. */

export const VERIFICATION_TIERS = ["full", "standard"];

/** Completed stays (= approved reviews) per host — spread 3–12 across 33 hosts. */
export const REVIEW_COUNTS_BY_HOST = [
  12, 3, 9, 5, 7, 11, 4, 8, 6, 10,
  3, 6, 9, 5, 12, 4, 7, 10, 8, 11,
  5, 3, 9, 6, 12, 4, 8, 10, 7, 11,
  5, 6, 9,
];

/** Verification depth cycles by host index (standard = no video verification). */
export const TIER_BY_HOST = [
  "full", "standard", "full", "standard", "full", "standard", "full", "standard", "full", "standard",
  "full", "standard", "full", "standard", "full", "standard", "full", "standard", "full", "standard",
  "full", "standard", "full", "standard", "full", "standard", "full", "standard", "full", "standard",
  "full", "standard", "full",
];

export function ratingsForHost(hostIndex, reviewCount, verificationTier = "full") {
  const ratings = [];
  const maxThrees =
    verificationTier === "full"
      ? 1 + ((hostIndex * 3 + reviewCount) % 3)
      : reviewCount >= 6
        ? hostIndex % 2
        : 0;
  const targetFours = 1 + ((hostIndex * 5 + reviewCount) % 4);
  let threes = 0;
  let fours = 0;

  for (let i = 0; i < reviewCount; i++) {
    const roll = (hostIndex * 17 + i * 11) % 23;
    if (threes < maxThrees && roll % 6 === 0) {
      ratings.push(3);
      threes += 1;
    } else if (fours < targetFours && roll % 3 === 0) {
      ratings.push(4);
      fours += 1;
    } else {
      ratings.push(5);
    }
  }

  return ratings;
}

export function hostVarietyProfile(hostIndex) {
  const reviewCount = REVIEW_COUNTS_BY_HOST[hostIndex % REVIEW_COUNTS_BY_HOST.length];
  const verificationTier = TIER_BY_HOST[hostIndex % TIER_BY_HOST.length];
  return {
    reviewCount,
    verificationTier,
    ratings: ratingsForHost(hostIndex, reviewCount, verificationTier),
  };
}
