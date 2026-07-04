import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExperienceProfileView } from "@/components/experiences/ExperienceProfileView";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import {
  canViewExperience,
  fetchApprovedHostIdsForUser,
} from "@/lib/experience-visibility";
import { createPageMetadata } from "@/lib/site-metadata";
import { getExperienceCoverPhotoUrl } from "@/lib/seo-cover-photos";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildExperienceJsonLd } from "@/lib/json-ld";
import { formatAverageRating } from "@/lib/reviews";
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
    .select("title, city, country, category, description, price_per_person, duration_minutes")
    .eq("id", id)
    .single();

  if (!data) {
    return createPageMetadata({
      title: "Experience Not Found",
      description: "This local experience could not be found on Fore Beyond.",
      path: `/experiences/${id}`,
      noIndex: true,
    });
  }

  const title = data.title ?? `Experience in ${data.city}`;
  const description =
    data.description?.slice(0, 155) ??
    `Join ${title} in ${data.city}, ${data.country}. Authentic local experiences on Fore Beyond.`;
  const coverPhoto = await getExperienceCoverPhotoUrl(supabase, id);

  return createPageMetadata({
    title,
    description,
    path: `/experiences/${id}`,
    ...(coverPhoto ? { image: coverPhoto } : {}),
  });
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

  let approvedHostIds: Set<string> | undefined;
  if (user) {
    approvedHostIds = await fetchApprovedHostIdsForUser(supabase, user.id);
  }

  if (
    !canViewExperience(typedExperience, {
      userId: user?.id,
      approvedHostIds,
    })
  ) {
    notFound();
  }

  const [{ data: photos }, { data: badges }, { data: reviews }, savedResult, profileResult] =
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
      user
        ? supabase.from("profiles").select("bio").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const experienceReviews = (reviews as PublicReview[] | null) ?? [];
  const avgRating = formatAverageRating(experienceReviews);

  return (
    <>
      <JsonLd
        data={buildExperienceJsonLd({
          id,
          title: typedExperience.title ?? `Experience in ${typedExperience.city}`,
          description:
            typedExperience.description?.slice(0, 300) ??
            `Join a local experience in ${typedExperience.city}, ${typedExperience.country}.`,
          city: typedExperience.city,
          country: typedExperience.country,
          category: typedExperience.category,
          image:
            (photos as ExperiencePhoto[] | null)?.find((photo) => photo.is_cover)?.file_url ??
            (photos as ExperiencePhoto[] | null)?.[0]?.file_url ??
            null,
          price: typedExperience.price_per_person,
          durationMinutes: typedExperience.duration_minutes,
          ratingValue: avgRating,
          reviewCount: experienceReviews.length,
        })}
      />
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
      reviews={experienceReviews}
      isSaved={Boolean(savedResult.data)}
      profileBio={(profileResult.data as { bio: string | null } | null)?.bio ?? null}
    />
    </>
  );
}
