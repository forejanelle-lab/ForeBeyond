import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FamilyProfileView } from "@/components/search/FamilyProfileView";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import type { HostListing, ListingPhoto, PublicListing, PublicReview, TrustBadge } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_listings")
    .select("title, city, country")
    .eq("id", id)
    .single();

  if (!data) return { title: "Family Not Found" };
  return { title: data.title ?? `Family in ${data.city}` };
}

export default async function FamilyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: listing }, { data: { user } }] = await Promise.all([
    supabase.from("public_listings").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!listing) notFound();

  const typedListing = listing as PublicListing;

  const [{ data: photos }, { data: badges }, { data: reviews }, savedResult] =
    await Promise.all([
      supabase
        .from("listing_photos")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order"),
      supabase
        .from("trust_badges")
        .select("*")
        .eq("user_id", typedListing.host_id),
      supabase
        .from("public_reviews")
        .select("*")
        .eq("reviewee_id", typedListing.host_id)
        .order("created_at", { ascending: false }),
      user
        ? supabase
            .from("saved_listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("listing_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const hostListing: HostListing = {
    id: typedListing.id,
    host_id: typedListing.host_id,
    title: typedListing.title,
    family_story: typedListing.family_story,
    languages: typedListing.languages,
    country: typedListing.country,
    city: typedListing.city,
    meals: typedListing.meals,
    amenities: typedListing.amenities,
    family_activities: typedListing.family_activities,
    house_rules: typedListing.house_rules,
    budget_per_night: typedListing.budget_per_night,
    status: "published",
    published_at: typedListing.published_at,
    created_at: typedListing.created_at,
    updated_at: typedListing.created_at,
  };

  return (
    <>
      <TrackPageEvent
        event={AnalyticsEvents.FAMILY_PROFILE_VIEW}
        data={{ listing_id: id, city: typedListing.city ?? "", country: typedListing.country ?? "" }}
      />
      <FamilyProfileView
      listing={hostListing}
      photos={(photos as ListingPhoto[]) ?? []}
      hostFirstName={typedListing.host_first_name}
      trustScore={typedListing.trust_score}
      verificationStatus={typedListing.verification_status}
      badges={(badges as TrustBadge[]) ?? []}
      reviews={(reviews as PublicReview[]) ?? []}
      isSaved={Boolean(savedResult.data)}
      userId={user?.id ?? null}
    />
    </>
  );
}
