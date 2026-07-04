import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHostListingId } from "@/lib/host-listing-limit";
import { ListingWizard } from "@/components/listings/ListingWizard";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import {
  HOST_LISTING_VERIFICATION_MESSAGE,
  canCreateHostListing,
  documentsMapFromRows,
} from "@/lib/traveler-verification";
import type { DocumentType, HostProfile, Profile, VerificationStatus } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Create Listing",
  description: "Create a new host listing on Fore Beyond.",
  path: "/host/listings/new",
});

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/listings/new");

  const [{ data: profile }, { data: hostProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("host_profiles").select("languages_spoken, max_guests").eq("user_id", user.id).maybeSingle(),
  ]);

  const typedProfile = profile as Pick<Profile, "full_name" | "role"> | null;
  const typedHostProfile = hostProfile as Pick<HostProfile, "languages_spoken" | "max_guests"> | null;

  if (typedProfile?.role !== "host") {
    redirect("/profile/complete");
  }

  const existingListingId = await getHostListingId(supabase, user.id);
  if (existingListingId) {
    redirect(`/host/listings/${existingListingId}/edit`);
  }

  const { data: verificationDocs } = await supabase
    .from("verification_documents")
    .select("document_type, status")
    .eq("user_id", user.id)
    .in("document_type", ["government_id", "selfie"]);

  const canCreateListing = canCreateHostListing(
    documentsMapFromRows(
      verificationDocs as
        | { document_type: DocumentType; status: VerificationStatus }[]
        | null
    )
  );

  if (!canCreateListing) {
    return (
      <Container size="md" className="py-16 md:py-24">
        <Card variant="elevated" padding="lg" className="max-w-lg mx-auto text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage/60 text-forest">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-forest">Verification required</h1>
          <p className="text-sm text-charcoal-light">{HOST_LISTING_VERIFICATION_MESSAGE}</p>
          <ButtonLink href="/verification-center" variant="primary" size="md">
            Go to Verification Center
          </ButtonLink>
          <Link href="/host/listings" className="block text-sm text-forest hover:underline">
            Back to listings
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" className="py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-forest">Create a family listing</h1>
        <p className="mt-2 text-charcoal-light">
          Welcome travelers into your home and share your culture.
        </p>
      </div>
      <ListingWizard
        userId={user.id}
        hostName={typedProfile?.full_name}
        initialLanguagesSpoken={typedHostProfile?.languages_spoken ?? null}
        initialMaxCapacity={typedHostProfile?.max_guests ?? null}
        mode="create"
      />
    </Container>
  );
}
