import { redirect } from "next/navigation";
import { Heart, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExperienceResultsGrid } from "@/components/experiences/ExperienceResultsGrid";
import {
  filterExperiencesByVisibility,
  fetchApprovedHostIdsForUser,
} from "@/lib/experience-visibility";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { ExperiencePhoto, PublicExperience } from "@/types/database";

export const metadata = { title: "Saved Experiences" };

async function getCoverPhotos(experienceIds: string[]) {
  if (experienceIds.length === 0) return {};

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("experience_photos")
    .select("experience_id, file_url, is_cover, sort_order")
    .in("experience_id", experienceIds)
    .order("sort_order");

  const coverMap: Record<string, string> = {};
  (photos as Pick<ExperiencePhoto, "experience_id" | "file_url" | "is_cover">[] | null)?.forEach(
    (photo) => {
      if (photo.is_cover || !coverMap[photo.experience_id]) {
        coverMap[photo.experience_id] = photo.file_url;
      }
    }
  );

  return coverMap;
}

export default async function SavedExperiencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/experiences/saved");

  const { data: savedRows } = await supabase
    .from("saved_experiences")
    .select("experience_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const experienceIds = savedRows?.map((row) => row.experience_id) ?? [];

  let experiences: PublicExperience[] = [];
  if (experienceIds.length > 0) {
    const { data } = await supabase
      .from("public_experiences")
      .select("*")
      .in("id", experienceIds);
    const fetched = (data as PublicExperience[]) ?? [];
    const approvedHostIds = await fetchApprovedHostIdsForUser(supabase, user.id);
    experiences = filterExperiencesByVisibility(fetched, {
      userId: user.id,
      approvedHostIds,
    });
    experiences.sort(
      (a, b) => experienceIds.indexOf(a.id) - experienceIds.indexOf(b.id)
    );
  }

  const coverPhotos = await getCoverPhotos(experienceIds);

  return (
    <Container className="py-10 md:py-16 lg:py-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Heart className="h-3 w-3" />
            Saved Experiences
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-forest">Your favorites</h1>
          <p className="mt-2 text-charcoal-light">
            {experiences.length} saved {experiences.length === 1 ? "experience" : "experiences"}
          </p>
        </div>
        <ButtonLink href="/experiences" variant="secondary" size="md">
          <Sparkles className="h-4 w-4" />
          Browse experiences
        </ButtonLink>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <Heart className="h-10 w-10 text-forest mx-auto mb-4" />
          <p className="text-charcoal-light mb-4">You haven&apos;t saved any experiences yet.</p>
          <ButtonLink href="/experiences" variant="primary" size="lg">
            <Sparkles className="h-4 w-4" />
            Explore experiences
          </ButtonLink>
        </div>
      ) : (
        <ExperienceResultsGrid
          experiences={experiences}
          coverPhotos={coverPhotos}
          savedExperienceIds={experienceIds}
        />
      )}
    </Container>
  );
}
