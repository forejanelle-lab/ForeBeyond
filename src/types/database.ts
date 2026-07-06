export type UserRole = "traveler" | "host";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "in_review"
  | "verified"
  | "rejected";

export type OnboardingStep =
  | "profile"
  | "preferences"
  | "verification"
  | "complete";

export type StayRequestStatus =
  | "pending"
  | "host_approved"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export type BookingPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type DataRequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ListingStatus = "draft" | "published" | "archived";

export type ExperienceStatus = "draft" | "published" | "archived";

export type ExperienceVisibility = "all_members" | "approved_guests_only";

export type ExperienceCategory =
  | "family_dinner"
  | "cooking_class"
  | "market_tour"
  | "tea_ceremony"
  | "cultural_workshop"
  | "hiking"
  | "other";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type ReportCategory = "spam" | "harassment" | "fraud" | "inappropriate" | "other";

export type SupportRequestStatus = "open" | "resolved" | "archived";

export type ReviewModerationStatus = "pending" | "approved" | "rejected" | "hidden";

export type TripStatus = "upcoming" | "active" | "completed" | "cancelled";

export type ExperienceBookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type DocumentType =
  | "government_id"
  | "selfie"
  | "address_proof"
  | "phone_verification"
  | "video_verification";

export type BadgeType =
  | "identity_verified"
  | "community_vouched"
  | "experienced_host"
  | "experienced_traveler"
  | "phone_verified"
  | "video_verified"
  | "address_verified"
  | "trusted_member";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole | null;
  phone: string | null;
  location: string | null;
  languages: string[] | null;
  onboarding_step: OnboardingStep;
  onboarding_complete: boolean;
  verification_status: VerificationStatus;
  trust_score: number;
  trust_score_breakdown: Record<string, number> | null;
  profile_completion: number;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  video_verified_at: string | null;
  address_verified_at: string | null;
  is_trust_moderator?: boolean;
  is_admin?: boolean;
  default_currency: string;
  preferred_language: string;
  stripe_customer_id: string | null;
  last_login_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserLoginEvent {
  id: string;
  user_id: string;
  logged_in_at: string;
  ip_address: string | null;
  user_agent: string | null;
  auth_method: string;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  first_name: string | null;
  role: UserRole | null;
  bio: string | null;
  location: string | null;
  languages: string[] | null;
  trust_score: number;
  profile_completion: number;
  verification_status: VerificationStatus;
  onboarding_complete: boolean;
  created_at: string;
}

export interface TravelerProfile {
  id: string;
  user_id: string;
  interests: string[] | null;
  travel_style: string | null;
  dietary_preferences: string[] | null;
  accessibility_needs: string | null;
  preferred_destinations: string[] | null;
  stay_motivation: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostProfile {
  id: string;
  user_id: string;
  household_description: string | null;
  cultural_offerings: string[] | null;
  languages_spoken: string[] | null;
  max_guests: number;
  experience_description: string | null;
  host_motivation: string | null;
  neighborhood: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_url: string | null;
  status: VerificationStatus;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  awarded_at: string;
  expires_at: string | null;
}

export interface StayRequest {
  id: string;
  traveler_id: string;
  host_id: string;
  listing_id: string | null;
  status: StayRequestStatus;
  message: string | null;
  host_response: string | null;
  withdrawal_reason: string | null;
  start_date: string | null;
  end_date: string | null;
  guest_count: number;
  traveler_display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StayRequestPhoto {
  id: string;
  stay_request_id: string;
  file_url: string;
  sort_order: number;
  created_at: string;
}

export interface StayBooking {
  id: string;
  stay_request_id: string;
  trip_id: string | null;
  listing_id: string | null;
  traveler_id: string;
  host_id: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  nightly_rate: number | null;
  total_amount: number | null;
  payment_status: BookingPaymentStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StayMessage {
  id: string;
  stay_request_id: string;
  conversation_id: string | null;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  message_type: "text" | "image";
  created_at: string;
}

export interface Conversation {
  id: string;
  stay_request_id: string;
  traveler_id: string;
  host_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Trip {
  id: string;
  stay_request_id: string | null;
  traveler_id: string;
  host_id: string;
  listing_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  completed_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  trip_id: string | null;
  experience_booking_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  is_positive: boolean;
  reviewer_role: "traveler" | "host" | null;
  moderation_status: ReviewModerationStatus;
  moderated_at: string | null;
  moderated_by: string | null;
  moderation_notes: string | null;
  created_at: string;
}

export interface PublicReview {
  id: string;
  trip_id: string | null;
  listing_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  is_positive: boolean;
  reviewer_role: "traveler" | "host" | null;
  reviewer_first_name: string | null;
  created_at: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  reported_listing_id: string | null;
  reported_review_id: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export type SupportRequestSource = "member" | "partnership" | "contact";

export interface SupportRequest {
  id: string;
  user_id: string | null;
  user_full_name: string | null;
  user_email: string | null;
  message: string;
  source: SupportRequestSource;
  status: SupportRequestStatus;
  admin_response: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrivacySettings {
  user_id: string;
  profile_visible: boolean;
  show_location: boolean;
  show_bio: boolean;
  analytics_cookies: boolean;
  marketing_emails: boolean;
  functional_cookies: boolean;
  created_at: string;
  updated_at: string;
}

export interface CookieConsent {
  id: string;
  user_id: string | null;
  session_id: string | null;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  consented_at: string;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  status: DataRequestStatus;
  download_url: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  status: DataRequestStatus;
  reason: string | null;
  scheduled_for: string;
  completed_at: string | null;
  created_at: string;
}

export interface HostListing {
  id: string;
  host_id: string;
  title: string | null;
  family_story: string | null;
  stay_details: string | null;
  intro_video_url: string | null;
  languages: string[] | null;
  country: string | null;
  city: string | null;
  meals: string[] | null;
  amenities: string[] | null;
  family_activities: string[] | null;
  house_rules: string[] | null;
  budget_per_night: number | null;
  budget_per_night_3_guests: number | null;
  budget_per_night_4_guests: number | null;
  budget_per_night_5_guests: number | null;
  budget_per_night_6_plus_guests: number | null;
  pricing_currency?: string | null;
  max_capacity: number | null;
  status: ListingStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  file_url: string;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface ListingContactDetails {
  listing_id: string;
  contact_email: string | null;
  contact_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingBlockedDate {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicListing {
  id: string;
  host_id: string;
  title: string | null;
  family_story: string | null;
  stay_details: string | null;
  intro_video_url: string | null;
  host_motivation: string | null;
  languages: string[] | null;
  country: string | null;
  city: string | null;
  meals: string[] | null;
  amenities: string[] | null;
  family_activities: string[] | null;
  house_rules: string[] | null;
  budget_per_night: number | null;
  budget_per_night_3_guests: number | null;
  budget_per_night_4_guests: number | null;
  budget_per_night_5_guests: number | null;
  budget_per_night_6_plus_guests: number | null;
  pricing_currency?: string | null;
  max_capacity: number | null;
  published_at: string | null;
  created_at: string;
  trust_score: number;
  trust_score_breakdown: Record<string, number> | null;
  profile_completion: number;
  verification_status: VerificationStatus;
  host_first_name: string | null;
}

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface HostExperience {
  id: string;
  host_id: string;
  title: string | null;
  description: string | null;
  category: ExperienceCategory;
  languages: string[] | null;
  country: string | null;
  city: string | null;
  meeting_point: string | null;
  duration_minutes: number | null;
  max_guests: number;
  price_per_person: number | null;
  includes: string[] | null;
  requirements: string[] | null;
  visibility: ExperienceVisibility;
  status: ExperienceStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperiencePhoto {
  id: string;
  experience_id: string;
  file_url: string;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface PublicExperience {
  id: string;
  host_id: string;
  title: string | null;
  description: string | null;
  category: ExperienceCategory;
  languages: string[] | null;
  country: string | null;
  city: string | null;
  meeting_point: string | null;
  duration_minutes: number | null;
  max_guests: number;
  price_per_person: number | null;
  includes: string[] | null;
  requirements: string[] | null;
  visibility: ExperienceVisibility;
  published_at: string | null;
  created_at: string;
  trust_score: number;
  profile_completion: number;
  verification_status: VerificationStatus;
  host_first_name: string | null;
}

export interface SavedExperience {
  id: string;
  user_id: string;
  experience_id: string;
  created_at: string;
}

export interface ExperienceBooking {
  id: string;
  experience_id: string;
  host_id: string;
  traveler_id: string;
  status: ExperienceBookingStatus;
  scheduled_date: string;
  scheduled_time: string | null;
  guest_count: number;
  message: string | null;
  total_price: number | null;
  created_at: string;
  updated_at: string;
}
