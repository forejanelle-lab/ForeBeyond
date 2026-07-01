import Image from "next/image";
import { Globe, MapPin, Shield, User } from "lucide-react";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { TrustScoreBreakdown } from "@/components/trust/TrustScoreBreakdown";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { ReviewList } from "@/components/reviews/ReviewList";
import { VerificationBadgeRow } from "@/components/design/VerificationBadgeRow";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getVerificationStatusLabel } from "@/lib/trust-score-detail";
import type { TrustScoreBreakdown as Breakdown } from "@/lib/trust-score";
import type { Profile, PublicReview, TrustBadge, UserRole } from "@/types/database";
import { TravelerOnboardingDetails } from "@/components/profile/TravelerOnboardingDetails";
import type { TravelerOnboardingForHost } from "@/lib/traveler-onboarding-labels";

interface GuestTrustProfileProps {
  displayName: string;
  profile: Pick<
    Profile,
    | "bio"
    | "location"
    | "languages"
    | "avatar_url"
    | "trust_score"
    | "trust_score_breakdown"
    | "profile_completion"
    | "verification_status"
    | "role"
    | "created_at"
  >;
  travelerOnboarding?: TravelerOnboardingForHost | null;
  badges: TrustBadge[];
  reviews: PublicReview[];
}

export function GuestTrustProfile({
  displayName,
  profile,
  travelerOnboarding = null,
  badges,
  reviews,
}: GuestTrustProfileProps) {
  const breakdown = (profile.trust_score_breakdown ?? {}) as Breakdown;
  const isVerified = profile.verification_status === "verified";
  const hasAvatar = Boolean(profile.avatar_url?.trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card variant="outline" padding="md" className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-sage-dark/40 bg-sage/40">
              {hasAvatar ? (
                <Image
                  src={profile.avatar_url!}
                  alt={`${displayName} profile`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                  key={profile.avatar_url}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-charcoal-light">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="text-2xl font-bold text-forest">{displayName}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant={isVerified ? "success" : "outline"}>
                  <Shield className="h-3 w-3" />
                  {getVerificationStatusLabel(profile.verification_status)}
                </Badge>
                <Badge variant="gold">Trust {profile.trust_score ?? 0}</Badge>
              </div>
              {profile.location && (
                <p className="flex items-center gap-1.5 text-sm text-charcoal-light">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {profile.location}
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-charcoal-light whitespace-pre-wrap border-t border-sage-dark/30 pt-4">
              {profile.bio}
            </p>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div className="border-t border-sage-dark/30 pt-4">
              <p className="text-sm font-medium text-forest mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Languages
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <TravelerOnboardingDetails profile={travelerOnboarding} />

        <ReviewList
          title="Reviews from other hosts"
          reviews={reviews}
          showReviewerName
          emptyMessage="This guest has no reviews from other host families yet."
        />
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <Card variant="elevated" padding="lg" className="text-center">
          <p className="text-sm font-medium text-charcoal-light mb-4">Trust Score</p>
          <TrustScoreRing score={profile.trust_score ?? 0} size="md" />
          <p className="mt-4 text-sm text-charcoal-light">
            Profile {profile.profile_completion ?? 0}% complete
          </p>
          <div className="mt-4">
            <VerificationBadgeRow verified={isVerified} />
          </div>
        </Card>

        <Card variant="outline" padding="lg">
          <h2 className="text-lg font-semibold text-forest mb-4">Score breakdown</h2>
          <TrustScoreBreakdown
            breakdown={breakdown}
            role={(profile.role as UserRole | null) ?? "traveler"}
          />
        </Card>

        {badges.length > 0 && (
          <Card variant="outline" padding="md">
            <h2 className="text-lg font-semibold text-forest mb-4">Trust badges</h2>
            <TrustBadges badges={badges} />
          </Card>
        )}
      </div>
    </div>
  );
}
