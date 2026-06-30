import { redirect } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import { HostExperienceBookings } from "@/components/experiences/HostExperienceBookings";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import type { ExperiencePhoto, HostExperience } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Manage Experiences",
  description: "Create and manage local experiences on Fore Beyond.",
  path: "/host/experiences",
});

export default async function ManageExperiencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/experiences");

  const { data: experiences } = await supabase
    .from("host_experiences")
    .select("*")
    .eq("host_id", user.id)
    .order("updated_at", { ascending: false });

  const typedExperiences = (experiences as HostExperience[]) ?? [];

  const experienceIds = typedExperiences.map((e) => e.id);
  const coverMap: Record<string, ExperiencePhoto> = {};

  if (experienceIds.length > 0) {
    const { data: photos } = await supabase
      .from("experience_photos")
      .select("*")
      .in("experience_id", experienceIds)
      .eq("is_cover", true);

    (photos as ExperiencePhoto[] | null)?.forEach((p) => {
      coverMap[p.experience_id] = p;
    });

    const missingCover = experienceIds.filter((id) => !coverMap[id]);
    if (missingCover.length > 0) {
      const { data: firstPhotos } = await supabase
        .from("experience_photos")
        .select("*")
        .in("experience_id", missingCover)
        .order("sort_order");

      (firstPhotos as ExperiencePhoto[] | null)?.forEach((p) => {
        if (!coverMap[p.experience_id]) coverMap[p.experience_id] = p;
      });
    }
  }

  const { data: bookings } = await supabase
    .from("experience_bookings")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const typedBookings = (bookings ?? []) as import("@/types/database").ExperienceBooking[];
  const travelerIds = [...new Set(typedBookings.map((b) => b.traveler_id))];
  const bookingExperienceIds = [...new Set(typedBookings.map((b) => b.experience_id))];

  const [{ data: travelers }, { data: bookingExperiences }] = await Promise.all([
    travelerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", travelerIds)
      : Promise.resolve({ data: [] }),
    bookingExperienceIds.length > 0
      ? supabase.from("host_experiences").select("id, title").in("id", bookingExperienceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const travelerMap = Object.fromEntries(
    ((travelers as { id: string; full_name: string | null }[]) ?? []).map((t) => [
      t.id,
      t.full_name?.split(" ")[0] ?? "Traveler",
    ])
  );
  const experienceTitleMap = Object.fromEntries(
    ((bookingExperiences as { id: string; title: string | null }[]) ?? []).map((e) => [
      e.id,
      e.title ?? "Experience",
    ])
  );

  const bookingRows = typedBookings.map((b) => ({
    ...b,
    traveler_name: travelerMap[b.traveler_id] ?? "Traveler",
    experience_title: experienceTitleMap[b.experience_id] ?? "Experience",
  }));

  return (
    <Container className="py-16 md:py-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Sparkles className="h-3 w-3" />
            Manage Experiences
          </Badge>
          <h1 className="text-3xl font-bold text-forest">Your experiences</h1>
          <p className="mt-2 text-charcoal-light">
            {typedExperiences.length} experience{typedExperiences.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ButtonLink href="/host/experiences/new" variant="primary" size="md">
          <Plus className="h-4 w-4" />
          New Experience
        </ButtonLink>
      </div>

      {typedExperiences.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <p className="text-charcoal-light mb-4">You haven&apos;t created an experience yet.</p>
          <ButtonLink href="/host/experiences/new" variant="primary" size="lg">
            <Plus className="h-4 w-4" />
            Create Your First Experience
          </ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {typedExperiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              coverPhoto={coverMap[experience.id] ?? null}
              hostId={user.id}
            />
          ))}
        </div>
      )}

      <HostExperienceBookings bookings={bookingRows} hostId={user.id} />
    </Container>
  );
}
