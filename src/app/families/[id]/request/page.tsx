import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { getStayBlockedDates } from "@/lib/stay-availability";
import { RequestStayWizard } from "@/components/stays/RequestStayWizard";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import type { PublicListing } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_listings")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ? `Request Stay — ${data.title}` : "Request Stay" };
}

export default async function RequestStayPage({
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

  const { data: profile } = user
    ? await supabase.from("profiles").select("bio").eq("id", user.id).maybeSingle()
    : { data: null };

  const { data: travelerProfile } = user
    ? await supabase
        .from("traveler_profiles")
        .select("stay_motivation")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (!listing) notFound();

  const typedListing = listing as PublicListing;
  const blockedDateRanges = await getStayBlockedDates(supabase, id);

  return (
    <>
      <PageHero
        image={sampleImages.familyKitchen}
        imageAlt="Request a stay with a host family"
        eyebrow="Request Stay"
        title="Request to stay"
        subtitle={`Introduce yourself and share your travel plans with ${typedListing.host_first_name ?? "this family"}.`}
        height="md"
      />

      <Container size="md" className="py-10 md:py-14">
        <Link
          href={`/families/${id}`}
          className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to family profile
        </Link>

        <TrackPageEvent event={AnalyticsEvents.REQUEST_START} data={{ listing_id: id }} />

        <Card variant="elevated" padding="lg" className="max-w-2xl mx-auto">
          <RequestStayWizard
            listing={typedListing}
            userId={user?.id ?? null}
            blockedDateRanges={blockedDateRanges}
            profileBio={(profile as { bio: string | null } | null)?.bio ?? null}
            profileStayMotivation={
              (travelerProfile as { stay_motivation: string | null } | null)?.stay_motivation ??
              null
            }
          />
          <p className="flex items-center justify-center gap-1.5 text-xs text-charcoal-light mt-6 pt-6 border-t border-sage-dark/20">
            <Lock className="h-3.5 w-3.5" />
            Your information is safe and private
          </p>
        </Card>
      </Container>
    </>
  );
}
