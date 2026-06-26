import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { ExperienceCategoryPills } from "@/components/design/ExperienceCategoryPills";
import { ExperienceFiltersPanel } from "@/components/experiences/ExperienceFiltersPanel";
import { ExperienceResultsGrid } from "@/components/experiences/ExperienceResultsGrid";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
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

export const metadata = { title: "Experiences Marketplace" };

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
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
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
    <>
      <PageHero
        image={sampleImages.cookingClass}
        imageAlt="Local cultural experiences with host families"
        eyebrow="Experiences Marketplace"
        title="Explore Local Experiences"
        subtitle="Family dinners, cooking classes, market tours, and more — book independently of where you stay."
        height="md"
      />

      <Container className="py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <ExperienceCategoryPills />
          <Link
            href="/experiences/saved"
            className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline shrink-0"
          >
            <Heart className="h-4 w-4" />
            Saved experiences
          </Link>
        </div>

        <Suspense fallback={<p className="text-sm text-charcoal-light">Loading experiences...</p>}>
          <ExperienceResults searchParams={params} />
        </Suspense>

        <Card
          variant="elevated"
          padding="lg"
          className="mt-14 text-center bg-forest text-white border-0"
        >
          <h2 className="text-2xl font-bold mb-2">Can&apos;t stay overnight? No problem!</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Book cultural experiences with local families even if you&apos;re not staying with them.
          </p>
          <ButtonLink href="/search" variant="gold" size="lg">
            Explore More
          </ButtonLink>
        </Card>
      </Container>
    </>
  );
}
