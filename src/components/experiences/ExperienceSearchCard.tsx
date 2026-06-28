"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Heart, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDuration, formatPrice, getCategoryLabel } from "@/lib/experiences";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ExperienceCoverFallback } from "@/components/experiences/ExperienceCoverFallback";
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

  const title = experience.title ?? getCategoryLabel(experience.category);
  const href = `/experiences/${experience.id}`;

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/sign-in?redirect=${href}`);
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
    <Card variant="outline" padding="sm" className="overflow-hidden group hover:shadow-md transition-shadow h-full">
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-sage mb-4">
          {coverPhotoUrl ? (
            <Image
              src={coverPhotoUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="400px"
            />
          ) : (
            <ExperienceCoverFallback size="sm" />
          )}
          <Badge variant="gold" className="absolute top-2 left-2">
            {getCategoryLabel(experience.category)}
          </Badge>
          <button
            type="button"
            onClick={toggleSave}
            disabled={isSaving}
            aria-label={saved ? "Remove from saved" : "Save experience"}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${saved ? "fill-forest text-forest" : "text-charcoal-light"}`}
            />
          </button>
        </div>

        <h3 className="font-semibold text-forest truncate group-hover:text-forest-light transition-colors">
          {title}
        </h3>
        {(experience.city || experience.country) && (
          <p className="flex items-center gap-1 text-sm text-charcoal-light mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[experience.city, experience.country].filter(Boolean).join(", ")}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 text-sm text-charcoal-light">
          <span className="font-medium text-forest">{formatPrice(experience.price_per_person)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(experience.duration_minutes)}
          </span>
        </div>
      </Link>

      <div className="flex gap-2 mt-4">
        <Link href={href} className="flex-1">
          <span className="flex items-center justify-center gap-1.5 w-full rounded-full border border-sage-dark px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage/50 transition-colors">
            <Eye className="h-3.5 w-3.5" />
            View
          </span>
        </Link>
      </div>
    </Card>
  );
}
