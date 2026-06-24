import { Shield, Phone, Video, MapPin, BadgeCheck, Users, Compass, Home } from "lucide-react";
import { BADGE_LABELS } from "@/lib/trust-score";
import { Badge } from "@/components/ui/Badge";
import type { BadgeType, TrustBadge } from "@/types/database";

const BADGE_ICONS: Record<BadgeType, typeof Shield> = {
  identity_verified: Shield,
  background_checked: Shield,
  community_vouched: Users,
  experienced_host: Home,
  experienced_traveler: Compass,
  phone_verified: Phone,
  video_verified: Video,
  address_verified: MapPin,
  trusted_member: BadgeCheck,
};

interface TrustBadgesProps {
  badges: TrustBadge[];
  emptyMessage?: string;
}

export function TrustBadges({ badges, emptyMessage = "No badges earned yet" }: TrustBadgesProps) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-charcoal-light text-center py-6">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge.badge_type] ?? BadgeCheck;
        return (
          <div
            key={badge.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-sage-dark/40 bg-white p-4 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="gold" className="text-center">
              {BADGE_LABELS[badge.badge_type] ?? badge.badge_type}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
