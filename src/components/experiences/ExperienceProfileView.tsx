import Image from "next/image";
import { Clock, Globe, MapPin, Shield, Users } from "lucide-react";
import { ListingTrustPanel } from "@/components/listings/ListingTrustPanel";
import { BookExperienceForm } from "@/components/experiences/BookExperienceForm";
import { SaveExperienceButton } from "@/components/experiences/SaveExperienceButton";
import { ExperienceCoverFallback } from "@/components/experiences/ExperienceCoverFallback";
import {
  formatDuration,
  formatPrice,
  getCategoryLabel,
} from "@/lib/experiences";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { ExperiencePhoto, PublicExperience, PublicReview, TrustBadge } from "@/types/database";

interface ExperienceProfileViewProps {
  experience: PublicExperience;
  photos: ExperiencePhoto[];
  badges: TrustBadge[];
  reviews: PublicReview[];
  isSaved?: boolean;
}

export function ExperienceProfileView({
  experience,
  photos,
  badges,
  reviews,
  isSaved = false,
}: ExperienceProfileViewProps) {
  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0];

  return (
    <>
      <Section background="cream" className="!py-0">
        <div className="relative h-64 md:h-96 bg-sage">
          {coverPhoto ? (
            <Image
              src={coverPhoto.file_url}
              alt={experience.title ?? "Experience"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <ExperienceCoverFallback size="lg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Container className="absolute bottom-0 left-0 right-0 pb-6 md:pb-8">
            <Badge variant="gold" className="mb-3">
              {getCategoryLabel(experience.category)}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {experience.title ?? getCategoryLabel(experience.category)}
            </h1>
            {(experience.city || experience.country) && (
              <p className="flex items-center gap-1.5 text-white/85 mt-2">
                <MapPin className="h-4 w-4" />
                {[experience.city, experience.country].filter(Boolean).join(", ")}
              </p>
            )}
          </Container>
        </div>
      </Section>

      <Container className="py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">{formatPrice(experience.price_per_person)}</Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3" />
                {formatDuration(experience.duration_minutes)}
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3" />
                Up to {experience.max_guests} guests
              </Badge>
            </div>

            {experience.description && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-3">About this experience</h2>
                <p className="text-charcoal-light leading-relaxed whitespace-pre-wrap">
                  {experience.description}
                </p>
              </section>
            )}

            {experience.meeting_point && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Meeting point
                </h2>
                <p className="text-charcoal-light">{experience.meeting_point}</p>
              </section>
            )}

            {experience.languages && experience.languages.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5" /> Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {experience.languages.map((lang) => (
                    <Badge key={lang} variant="default">{lang}</Badge>
                  ))}
                </div>
              </section>
            )}

            {experience.includes && experience.includes.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-3">What&apos;s included</h2>
                <div className="flex flex-wrap gap-2">
                  {experience.includes.map((item) => (
                    <Badge key={item} variant="outline">{item}</Badge>
                  ))}
                </div>
              </section>
            )}

            {experience.requirements && experience.requirements.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Requirements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {experience.requirements.map((item) => (
                    <Badge key={item} variant="outline">{item}</Badge>
                  ))}
                </div>
              </section>
            )}

            {photos.length > 1 && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-4">Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sage">
                      <Image src={photo.file_url} alt={photo.caption ?? "Experience photo"} fill className="object-cover" sizes="300px" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <SaveExperienceButton experienceId={experience.id} initialSaved={isSaved} />
            <BookExperienceForm experience={experience} />
            <ListingTrustPanel
              hostFirstName={experience.host_first_name}
              trustScore={experience.trust_score}
              verificationStatus={experience.verification_status}
              badges={badges}
              reviews={reviews}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
