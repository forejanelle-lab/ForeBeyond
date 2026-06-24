import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExperienceProfileView } from "@/components/experiences/ExperienceProfileView";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import type { ExperiencePhoto, PublicExperience, PublicReview, TrustBadge } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_experiences")
    .select("title, city, country, category")
    .eq("id", id)
    .single();

  if (!data) return { title: "Experience Not Found" };
  return { title: data.title ?? `Experience in ${data.city}` };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: experience }, { data: { user } }] = await Promise.all([
    supabase.from("public_experiences").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!experience) notFound();

  const typedExperience = experience as PublicExperience;

  const [{ data: photos }, { data: badges }, { data: reviews }, savedResult] =
    await Promise.all([
      supabase
        .from("experience_photos")
        .select("*")
        .eq("experience_id", id)
        .order("sort_order"),
      supabase
        .from("trust_badges")
        .select("*")
        .eq("user_id", typedExperience.host_id),
      supabase
        .from("public_reviews")
        .select("*")
        .eq("reviewee_id", typedExperience.host_id)
        .order("created_at", { ascending: false }),
      user
        ? supabase
            .from("saved_experiences")
            .select("id")
            .eq("user_id", user.id)
            .eq("experience_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <>
      <TrackPageEvent
        event={AnalyticsEvents.EXPERIENCE_VIEW}
        data={{
          experience_id: id,
          category: typedExperience.category,
          city: typedExperience.city ?? "",
        }}
      />
      <ExperienceProfileView
      experience={typedExperience}
      photos={(photos as ExperiencePhoto[]) ?? []}
      badges={(badges as TrustBadge[]) ?? []}
      reviews={(reviews as PublicReview[]) ?? []}
      isSaved={Boolean(savedResult.data)}
    />
    </>
  );
}
