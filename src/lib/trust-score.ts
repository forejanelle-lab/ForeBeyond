export const TRUST_SCORE_MAX = 100;

export const TRUST_SCORE_WEIGHTS = {
  email_verified: 10,
  phone_verified: 10,
  government_id: 15,
  address_verification: 10,
  video_verification: 15,
  profile_completion: 10,
  completed_trips: 15,
  positive_reviews: 15,
} as const;

export type TrustScoreFactor = keyof typeof TRUST_SCORE_WEIGHTS;

export const TRUST_SCORE_FACTORS: {
  key: TrustScoreFactor;
  label: string;
  description: string;
  maxPoints: number;
}[] = [
  {
    key: "email_verified",
    label: "Email Verified",
    description: "Confirm your email address",
    maxPoints: TRUST_SCORE_WEIGHTS.email_verified,
  },
  {
    key: "phone_verified",
    label: "Phone Verified",
    description: "Verify your phone number",
    maxPoints: TRUST_SCORE_WEIGHTS.phone_verified,
  },
  {
    key: "government_id",
    label: "Government ID",
    description: "Submit a valid government-issued ID",
    maxPoints: TRUST_SCORE_WEIGHTS.government_id,
  },
  {
    key: "address_verification",
    label: "Address Verification",
    description: "Confirm your current address",
    maxPoints: TRUST_SCORE_WEIGHTS.address_verification,
  },
  {
    key: "video_verification",
    label: "Video Verification",
    description: "Complete a short video identity check",
    maxPoints: TRUST_SCORE_WEIGHTS.video_verification,
  },
  {
    key: "profile_completion",
    label: "Profile Completion",
    description: "Fill out your full profile",
    maxPoints: TRUST_SCORE_WEIGHTS.profile_completion,
  },
  {
    key: "completed_trips",
    label: "Completed Trips",
    description: "Complete cultural immersion stays",
    maxPoints: TRUST_SCORE_WEIGHTS.completed_trips,
  },
  {
    key: "positive_reviews",
    label: "Positive Reviews",
    description: "Earn reviews from hosts and travelers",
    maxPoints: TRUST_SCORE_WEIGHTS.positive_reviews,
  },
];

export type TrustScoreBreakdown = Partial<Record<TrustScoreFactor, number>>;

export function getTrustLevel(score: number): {
  label: string;
  color: "outline" | "default" | "gold" | "success";
} {
  if (score >= 80) return { label: "Highly Trusted", color: "success" };
  if (score >= 60) return { label: "Trusted", color: "gold" };
  if (score >= 40) return { label: "Building Trust", color: "default" };
  if (score >= 20) return { label: "Getting Started", color: "outline" };
  return { label: "New Member", color: "outline" };
}

export const BADGE_LABELS: Record<string, string> = {
  identity_verified: "Identity Verified",
  background_checked: "Background Checked",
  community_vouched: "Community Vouched",
  experienced_host: "Experienced Host",
  experienced_traveler: "Experienced Traveler",
  phone_verified: "Phone Verified",
  video_verified: "Video Verified",
  address_verified: "Address Verified",
  trusted_member: "Trusted Member",
};

export const VERIFICATION_WORKFLOWS = [
  {
    id: "email",
    title: "Email Verification",
    description: "Confirm your email address via the link we send you.",
    href: "/auth/verify-email",
    documentType: null,
    points: TRUST_SCORE_WEIGHTS.email_verified,
  },
  {
    id: "phone",
    title: "Phone Verification",
    description: "Verify your phone number with a one-time code.",
    href: "/verification-center?step=phone",
    documentType: "phone_verification",
    points: TRUST_SCORE_WEIGHTS.phone_verified,
  },
  {
    id: "government_id",
    title: "Government ID",
    description: "Upload a passport, driver's license, or national ID.",
    href: "/verification-center?step=government_id",
    documentType: "government_id",
    points: TRUST_SCORE_WEIGHTS.government_id,
  },
  {
    id: "address",
    title: "Address Verification",
    description: "Submit proof of your current address.",
    href: "/verification-center?step=address_proof",
    documentType: "address_proof",
    points: TRUST_SCORE_WEIGHTS.address_verification,
  },
  {
    id: "video",
    title: "Video Verification",
    description: "Record a short video to confirm your identity.",
    href: "/verification-center?step=video_verification",
    documentType: "video_verification",
    points: TRUST_SCORE_WEIGHTS.video_verification,
  },
  {
    id: "selfie",
    title: "Selfie Check",
    description: "Take a live selfie matching your ID.",
    href: "/verification-center?step=selfie",
    documentType: "selfie",
    points: 0,
  },
] as const;
