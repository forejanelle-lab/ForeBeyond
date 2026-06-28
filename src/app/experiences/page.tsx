import { Suspense } from "react";
import { Heart, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExperienceFiltersPanel } from "@/components/experiences/ExperienceFiltersPanel";
import { ExperienceResultsGrid } from "@/components/experiences/ExperienceResultsGrid";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import {
  filterExperiencesByVisibility,
  fetchApprovedHostIdsForUser,
} from "@/lib/experience-visibility";
import {
  filterExperiencesClientSide,
  getUniqueExperienceCountries,
  parseExperienceSearchParams,
} from "@/lib/experience-search";
import type { ExperiencePhoto, PublicExperience } from "@/types/database";

export const metadata = { title: "Experiences" };

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

async function ExperienceResults({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const filters = parseExperienceSearchParams(searchParams);

  const [{ data: experiences }, { data: { user } }] = await Promise.all([
    supabase.from("public_experiences").select("*").order("trust_score", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const allExperiences = (experiences as PublicExperience[]) ?? [];

  let approvedHostIds: Set<string> | undefined;
  if (user) {
    approvedHostIds = await fetchApprovedHostIdsForUser(supabase, user.id);
  }

  const visible = filterExperiencesByVisibility(allExperiences, {
    userId: user?.id,
    approvedHostIds,
  });
  const filtered = filterExperiencesClientSide(visible, filters);
  const countries = getUniqueExperienceCountries(visible);
  const coverPhotos = await getCoverPhotos(filtered.map((exp) => exp.id));

  let savedExperienceIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_experiences")
      .select("experience_id")
      .eq("user_id", user.id);
    savedExperienceIds = saved?.map((row) => row.experience_id) ?? [];
  }

  return (
    <div className="space-y-6">
      <ExperienceFiltersPanel countries={countries} resultCount={filtered.length} />
      <ExperienceResultsGrid
        experiences={filtered}
        coverPhotos={coverPhotos}
        savedExperienceIds={savedExperienceIds}
      />
    </div>
  );
}

export default async function ExperiencesMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <Container className="py-16 md:py-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Sparkles className="h-3 w-3" />
            Experiences
          </Badge>
          <h1 className="text-3xl font-bold text-forest">Explore experiences</h1>
          <p className="mt-2 text-charcoal-light">
            Family dinners, cooking classes, market tours, and more with local hosts.
          </p>
        </div>
        <ButtonLink href="/experiences/saved" variant="secondary" size="md">
          <Heart className="h-4 w-4" />
          Saved experiences
        </ButtonLink>
      </div>

      <Suspense fallback={<p className="text-sm text-charcoal-light">Loading experiences...</p>}>
        <ExperienceResults searchParams={params} />
      </Suspense>
    </Container>
  );
}
