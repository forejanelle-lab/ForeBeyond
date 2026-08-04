export type SocialPlatform = "instagram" | "facebook" | "linkedin" | "pinterest" | "tiktok";

export type SocialPostStatus = "draft" | "scheduled" | "published" | "failed";

export type SocialMarketingGoal =
  | "brand_awareness"
  | "recruit_hosts"
  | "recruit_travelers"
  | "promote_japan"
  | "promote_italy"
  | "promote_spain"
  | "promote_guatemala"
  | "mixed";

export const SOCIAL_MARKETING_GOALS: { value: SocialMarketingGoal; label: string }[] = [
  { value: "brand_awareness", label: "Brand Awareness" },
  { value: "recruit_hosts", label: "Recruit Hosts" },
  { value: "recruit_travelers", label: "Recruit Travelers" },
  { value: "promote_japan", label: "Promote Japan" },
  { value: "promote_italy", label: "Promote Italy" },
  { value: "promote_spain", label: "Promote Spain" },
  { value: "promote_guatemala", label: "Promote Guatemala" },
  { value: "mixed", label: "Mixed" },
];

export const SOCIAL_POST_COUNTS = [5, 10, 20, 30] as const;

export const SOCIAL_TONE_OPTIONS = [
  "Warm & Authentic",
  "Inspirational",
  "Premium Editorial",
  "Educational",
  "Community-focused",
] as const;

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  image_url: string | null;
  image_prompt: string | null;
  caption: string;
  hashtags: string[];
  theme: string | null;
  goal: string | null;
  tone: string | null;
  strategy_week: number | null;
  strategy_topic: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  status: SocialPostStatus;
  approved: boolean;
  publish_error: string | null;
  platform_media_id: string | null;
  platform_data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateSocialContentInput {
  postCount: number;
  goal: SocialMarketingGoal;
  theme: string;
  tone: string;
  scheduleMonth: string;
  additionalInstructions?: string;
}

export interface GeneratedPostDraft {
  caption: string;
  hashtags: string[];
  image_prompt: string;
  theme: string;
  strategy_week: number;
  strategy_topic: string;
  scheduled_at: string;
}

export interface ContentStrategyWeek {
  week: number;
  topic: string;
  focus: string;
}

export interface SocialPlatformConnection {
  id: string;
  platform: SocialPlatform;
  access_token: string;
  token_expires_at: string | null;
  account_id: string;
  account_username: string | null;
  account_name: string | null;
  page_id: string | null;
  page_name: string | null;
  metadata: Record<string, unknown>;
  connected_by: string | null;
  connected_at: string;
  updated_at: string;
}

export interface InstagramConnectionStatus {
  connected: boolean;
  source?: "oauth" | "env";
  username?: string | null;
  accountName?: string | null;
  pageName?: string | null;
  connectedAt?: string | null;
  expiresAt?: string | null;
  connectedByEmail?: string | null;
}

export interface InstagramCredentials {
  accessToken: string;
  businessAccountId: string;
}
