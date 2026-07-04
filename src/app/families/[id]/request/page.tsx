import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { getActiveListingStays, getStayBlockedDates } from "@/lib/stay-availability";
import { RequestStayWizard } from "@/components/stays/RequestStayWizard";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import {
  TRAVELER_ACCOUNT_REQUIRED_MESSAGE,
  getRequestStayEligibility,
  documentsMapFromRows,
} from "@/lib/traveler-verification";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getServerTranslations } from "@/lib/i18n/server";
import { privatePageMetadata } from "@/lib/site-metadata";
import type { DocumentType, Profile, PublicListing, VerificationStatus } from "@/types/database";

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

  const listingTitle = data?.title ?? "host family";
  return privatePageMetadata({
    title: data?.title ? `Request Stay — ${data.title}` : "Request Stay",
    description: `Request a stay with ${listingTitle} on Fore Beyond.`,
    path: `/families/${id}/request`,
  });
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
    ? await supabase.from("profiles").select("bio, role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (!listing) notFound();

  const typedListing = listing as PublicListing;
  const [blockedDateRanges, existingStays] = await Promise.all([
    getStayBlockedDates(supabase, id),
    getActiveListingStays(supabase, id),
  ]);

  let travelerCanRequestStay = false;
  let requestBlockedMessage = TRAVELER_ACCOUNT_REQUIRED_MESSAGE;
  if (user) {
    const { data: verificationDocs } = await supabase
      .from("verification_documents")
      .select("document_type, status")
      .eq("user_id", user.id)
      .in("document_type", ["government_id", "selfie"]);

    const eligibility = getRequestStayEligibility(
      (profile as Pick<Profile, "role"> | null)?.role ?? null,
      documentsMapFromRows(
        verificationDocs as
          | { document_type: DocumentType; status: VerificationStatus }[]
          | null
      )
    );
    travelerCanRequestStay = eligibility.canRequest;
    requestBlockedMessage = eligibility.disabledReason;
  }

  const { t } = await getServerTranslations();

  return (
    <>
      <PageHero
        image={sampleImages.familyKitchen}
        imageAlt="Request a stay with a host family"
        eyebrow={t("requestStay.eyebrow")}
        title={t("requestStay.title")}
        subtitle={`Introduce yourself and share your travel plans with ${typedListing.host_first_name ?? "this family"}.`}
        height="md"
      />

      <Container size="md" className="py-10 md:py-14">
        <Link
          href={`/families/${id}`}
          className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("requestStay.backToProfile")}
        </Link>

        <TrackPageEvent event={AnalyticsEvents.REQUEST_START} data={{ listing_id: id }} />

        <Card variant="elevated" padding="lg" className="max-w-2xl mx-auto">
          {travelerCanRequestStay ? (
            <RequestStayWizard
              listing={typedListing}
              userId={user?.id ?? null}
              blockedDateRanges={blockedDateRanges}
              existingStays={existingStays}
              profileBio={(profile as { bio: string | null } | null)?.bio ?? null}
            />
          ) : (
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage/60 text-forest">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-forest">
                {(profile as Pick<Profile, "role"> | null)?.role === "host"
                  ? "Traveler account required"
                  : "Verification required"}
              </h2>
              <p className="text-sm text-charcoal-light max-w-md mx-auto">
                {requestBlockedMessage}
              </p>
              {(profile as Pick<Profile, "role"> | null)?.role === "host" ? (
                <ButtonLink href="/" variant="primary" size="md">
                  Back to homepage
                </ButtonLink>
              ) : (
                <ButtonLink href="/verification-center" variant="primary" size="md">
                  Go to Verification Center
                </ButtonLink>
              )}
            </div>
          )}
          <p className="flex items-center justify-center gap-1.5 text-xs text-charcoal-light mt-6 pt-6 border-t border-sage-dark/20">
            <Lock className="h-3.5 w-3.5" />
            {t("requestStay.privateNote")}
          </p>
        </Card>
      </Container>
    </>
  );
}
