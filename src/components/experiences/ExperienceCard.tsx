import Link from "next/link";
import Image from "next/image";
import { Clock, Edit, Eye, Lock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExperienceDeleteButton } from "@/components/experiences/ExperienceDeleteButton";
import { ExperienceCoverFallback } from "@/components/experiences/ExperienceCoverFallback";
import { EXPERIENCE_VISIBILITY_LABELS } from "@/lib/experience-visibility";
import {
  EXPERIENCE_STATUS_LABELS,
  formatDuration,
  getCategoryLabel,
} from "@/lib/experiences";
import { DisplayExperiencePrice } from "@/components/i18n/DisplayMoney";
import type { ExperiencePhoto, HostExperience } from "@/types/database";

interface ExperienceCardProps {
  experience: HostExperience;
  coverPhoto?: ExperiencePhoto | null;
  hostId?: string;
}

export function ExperienceCard({ experience, coverPhoto, hostId }: ExperienceCardProps) {
  const status = EXPERIENCE_STATUS_LABELS[experience.status];

  return (
    <Card variant="outline" padding="sm" className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-sage mb-4">
        {coverPhoto ? (
          <Image
            src={coverPhoto.file_url}
            alt={experience.title ?? "Experience"}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <ExperienceCoverFallback size="sm" />
        )}
        <Badge variant={status.variant} className="absolute top-2 right-2">
          {status.label}
        </Badge>
        <Badge variant="gold" className="absolute top-2 left-2">
          {getCategoryLabel(experience.category)}
        </Badge>
      </div>

      <h3 className="font-semibold text-forest truncate">
        {experience.title ?? getCategoryLabel(experience.category)}
      </h3>
      {(experience.city || experience.country) && (
        <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[experience.city, experience.country].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex items-center justify-between mt-2 text-sm text-charcoal-light">
        <span className="font-medium text-forest">
          <DisplayExperiencePrice priceUsd={experience.price_per_person} />
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(experience.duration_minutes)}
        </span>
      </div>

      {experience.visibility === "approved_guests_only" && (
        <p className="flex items-center gap-1.5 mt-2 text-xs text-charcoal-light">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {EXPERIENCE_VISIBILITY_LABELS.approved_guests_only.label}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <Link href={`/host/experiences/${experience.id}/edit`} className="flex-1">
          <span className="flex items-center justify-center gap-1.5 w-full rounded-full border border-sage-dark px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage/50 transition-colors">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </span>
        </Link>
        {experience.status === "published" && (
          <Link href={`/experiences/${experience.id}`}>
            <span className="flex items-center justify-center gap-1.5 rounded-full border border-sage-dark px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage/50 transition-colors">
              <Eye className="h-3.5 w-3.5" />
              View
            </span>
          </Link>
        )}
      </div>
      {hostId && (
        <ExperienceDeleteButton
          experienceId={experience.id}
          hostId={hostId}
          title={experience.title}
        />
      )}
    </Card>
  );
}
