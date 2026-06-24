import { Suspense } from "react";
import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExperienceFiltersPanel } from "@/components/experiences/ExperienceFiltersPanel";
import { ExperienceResultsGrid } from "@/components/experiences/ExperienceResultsGrid";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
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
  const filtered = filterExperiencesClientSide(allExperiences, filters);
  const countries = getUniqueExperienceCountries(allExperiences);
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
      <div>
        <ExperienceResultsGrid
          experiences={filtered}
          coverPhotos={coverPhotos}
          savedExperienceIds={savedExperienceIds}
        />
      </div>
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
    <Container className="py-10 md:py-16 lg:py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Sparkles className="h-3 w-3" />
            Experiences Marketplace
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-forest">
            Book cultural experiences
          </h1>
          <p className="mt-2 text-charcoal-light max-w-2xl">
            Family dinners, cooking classes, market tours, and more — book independently of where you stay.
          </p>
        </div>
        <Link
          href="/experiences/saved"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline"
        >
          <Heart className="h-4 w-4" />
          Saved experiences
        </Link>
      </div>

      <Suspense fallback={<p className="text-sm text-charcoal-light">Loading experiences...</p>}>
        <ExperienceResults searchParams={params} />
      </Suspense>
    </Container>
  );
}
