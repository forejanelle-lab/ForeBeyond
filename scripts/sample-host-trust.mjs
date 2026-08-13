/** Trust score variety for sample.host.*@forebeyond.demo accounts. */

export const SAMPLE_TRUST_PROFILES = [
  { tier: "basic", verificationStatus: "pending" },
  { tier: "standard", verificationStatus: "in_review" },
  { tier: "id", verificationStatus: "verified" },
  { tier: "standard", verificationStatus: "verified" },
  { tier: "full", verificationStatus: "verified" },
  { tier: "basic", verificationStatus: "pending" },
  { tier: "full", verificationStatus: "verified" },
  { tier: "id", verificationStatus: "in_review" },
  { tier: "standard", verificationStatus: "verified" },
  { tier: "full", verificationStatus: "verified" },
];

const DOC_URL = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80";
const SELFIE_URL = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80";
const VIDEO_URL = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80";

export function verificationDocumentsForTier(tier) {
  const docs = [];
  if (tier === "id" || tier === "standard" || tier === "full") {
    docs.push(["government_id", DOC_URL]);
    docs.push(["selfie", SELFIE_URL]);
  }
  if (tier === "standard" || tier === "full") {
    docs.push(["address_proof", DOC_URL]);
  }
  if (tier === "full") {
    docs.push(["video_verification", VIDEO_URL]);
  }
  return docs;
}

export function profileFieldsForTrustProfile(trustProfile) {
  const { tier, verificationStatus } = trustProfile;
  const now = new Date().toISOString();

  return {
    verification_status: verificationStatus,
    email_verified_at: now,
    phone_verified_at: tier !== "email_only" ? now : null,
    address_verified_at: tier === "standard" || tier === "full" ? now : null,
    video_verified_at: tier === "full" ? now : null,
  };
}

export function getTrustProfile(index) {
  return SAMPLE_TRUST_PROFILES[index % SAMPLE_TRUST_PROFILES.length];
}
