"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, Heart, MapPin, Shield, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDuration, formatPrice, getCategoryLabel } from "@/lib/experiences";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PublicExperience } from "@/types/database";

interface ExperienceSearchCardProps {
  experience: PublicExperience;
  coverPhotoUrl?: string | null;
  isSaved?: boolean;
}

export function ExperienceSearchCard({
  experience,
  coverPhotoUrl,
  isSaved = false,
}: ExperienceSearchCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(isSaved);
  const [isSaving, setIsSaving] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/sign-in?redirect=/experiences/${experience.id}`);
      setIsSaving(false);
      return;
    }

    if (saved) {
      await supabase
        .from("saved_experiences")
        .delete()
        .eq("user_id", user.id)
        .eq("experience_id", experience.id);
      setSaved(false);
    } else {
      await supabase.from("saved_experiences").insert({
        user_id: user.id,
        experience_id: experience.id,
      });
      setSaved(true);
    }

    setIsSaving(false);
    router.refresh();
  }

  return (
    <Link href={`/experiences/${experience.id}`} className="block group">
      <Card variant="outline" padding="sm" className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-sage mb-4">
          {coverPhotoUrl ? (
            <Image
              src={coverPhotoUrl}
              alt={experience.title ?? "Experience"}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-charcoal-light">
              No photo yet
            </div>
          )}

          <button
            type="button"
            onClick={toggleSave}
            disabled={isSaving}
            aria-label={saved ? "Remove from saved" : "Save experience"}
            className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-forest text-forest" : "text-charcoal-light"}`} />
          </button>

          <Badge variant="gold" className="absolute top-2 left-2">
            {getCategoryLabel(experience.category)}
          </Badge>
        </div>

        <h3 className="font-semibold text-forest line-clamp-2 group-hover:text-forest-light transition-colors">
          {experience.title ?? getCategoryLabel(experience.category)}
        </h3>

        {(experience.city || experience.country) && (
          <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[experience.city, experience.country].filter(Boolean).join(", ")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="gold">
            <Star className="h-3 w-3" />
            {experience.trust_score}
          </Badge>
          {experience.verification_status === "verified" && (
            <Badge variant="success">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="font-medium text-forest">{formatPrice(experience.price_per_person)}</span>
          <span className="flex items-center gap-1 text-charcoal-light">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(experience.duration_minutes)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
