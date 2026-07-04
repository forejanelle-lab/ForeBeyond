import { Compass, Heart, Utensils, Accessibility } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  formatTravelStyle,
  hasTravelerOnboardingDetails,
  type TravelerOnboardingForHost,
} from "@/lib/traveler-onboarding-labels";

interface TravelerOnboardingDetailsProps {
  profile: TravelerOnboardingForHost | null;
  title?: string;
  emptyMessage?: string;
}

export function TravelerOnboardingDetails({
  profile,
  title = "Traveler preferences",
  emptyMessage = "This guest has not shared onboarding preferences yet.",
}: TravelerOnboardingDetailsProps) {
  if (!hasTravelerOnboardingDetails(profile)) {
    return (
      <Card variant="outline" padding="md">
        <h2 className="font-semibold text-forest mb-2">{title}</h2>
        <p className="text-sm text-charcoal-light">{emptyMessage}</p>
      </Card>
    );
  }

  const travelStyle = formatTravelStyle(profile?.travel_style);

  return (
    <Card variant="outline" padding="md" className="space-y-4">
      <h2 className="font-semibold text-forest">{title}</h2>

      {profile?.interests && profile.interests.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-forest flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Interests
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="outline">
                {interest}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {travelStyle && (
        <section className="space-y-1">
          <p className="text-sm font-medium text-forest flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Travel style
          </p>
          <p className="text-sm text-charcoal-light">{travelStyle}</p>
        </section>
      )}

      {profile?.dietary_preferences && profile.dietary_preferences.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-forest flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Dietary preferences
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.dietary_preferences.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {profile?.accessibility_needs?.trim() && (
        <section className="space-y-1">
          <p className="text-sm font-medium text-forest flex items-center gap-2">
            <Accessibility className="h-4 w-4" />
            Accessibility needs
          </p>
          <p className="text-sm text-charcoal-light whitespace-pre-wrap">
            {profile.accessibility_needs}
          </p>
        </section>
      )}
    </Card>
  );
}
