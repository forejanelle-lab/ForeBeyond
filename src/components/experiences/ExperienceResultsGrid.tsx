import { ExperienceSearchCard } from "@/components/experiences/ExperienceSearchCard";
import { Card } from "@/components/ui/Card";
import type { PublicExperience } from "@/types/database";

interface ExperienceResultsGridProps {
  experiences: PublicExperience[];
  coverPhotos: Record<string, string>;
  savedExperienceIds?: string[];
}

export function ExperienceResultsGrid({
  experiences,
  coverPhotos,
  savedExperienceIds = [],
}: ExperienceResultsGridProps) {
  if (experiences.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-16">
        <p className="text-lg font-medium text-forest mb-2">No experiences match your search</p>
        <p className="text-sm text-charcoal-light max-w-md mx-auto">
          Try a different category or location to discover cultural experiences with local families.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
      {experiences.map((experience) => (
        <ExperienceSearchCard
          key={experience.id}
          experience={experience}
          coverPhotoUrl={coverPhotos[experience.id] ?? null}
          isSaved={savedExperienceIds.includes(experience.id)}
        />
      ))}
    </div>
  );
}
