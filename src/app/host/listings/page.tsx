import { redirect } from "next/navigation";
import { Plus, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/ListingCard";
import { CreateListingButton } from "@/components/listings/CreateListingButton";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import {
  documentsMapFromRows,
  getHostListingEligibility,
} from "@/lib/traveler-verification";
import type { DocumentType, HostListing, ListingPhoto, VerificationStatus } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Manage Listings",
  description: "Create and manage your host listings on Fore Beyond.",
  path: "/host/listings",
});

export default async function ManageListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/listings");

  const { data: verificationDocs } = await supabase
    .from("verification_documents")
    .select("document_type, status")
    .eq("user_id", user.id)
    .in("document_type", ["government_id", "selfie"]);

  const listingEligibility = getHostListingEligibility(
    documentsMapFromRows(
      verificationDocs as
        | { document_type: DocumentType; status: VerificationStatus }[]
        | null
    )
  );

  const { data: listings } = await supabase
    .from("host_listings")
    .select("*")
    .eq("host_id", user.id)
    .order("updated_at", { ascending: false });

  const typedListings = (listings as HostListing[]) ?? [];

  const listingIds = typedListings.map((l) => l.id);
  const coverMap: Record<string, ListingPhoto> = {};

  if (listingIds.length > 0) {
    const { data: photos } = await supabase
      .from("listing_photos")
      .select("*")
      .in("listing_id", listingIds)
      .eq("is_cover", true);

    (photos as ListingPhoto[] | null)?.forEach((p) => {
      coverMap[p.listing_id] = p;
    });

    const missingCover = listingIds.filter((id) => !coverMap[id]);
    if (missingCover.length > 0) {
      const { data: firstPhotos } = await supabase
        .from("listing_photos")
        .select("*")
        .in("listing_id", missingCover)
        .order("sort_order");

      (firstPhotos as ListingPhoto[] | null)?.forEach((p) => {
        if (!coverMap[p.listing_id]) coverMap[p.listing_id] = p;
      });
    }
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <Badge variant="gold" className="mb-4">
            <Home className="h-3 w-3" />
            Manage Listings
          </Badge>
          <h1 className="text-3xl font-bold text-forest">Your family listings</h1>
          <p className="mt-2 text-charcoal-light">
            {typedListings.length === 0
              ? "Create your family listing to welcome travelers."
              : "One listing per account — edit yours below."}
          </p>
        </div>
        {typedListings.length === 0 && (
          <CreateListingButton
            enabled={listingEligibility.canCreate}
            disabledReason={listingEligibility.disabledReason}
            size="md"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </CreateListingButton>
        )}
      </div>

      {typedListings.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <p className="text-charcoal-light mb-4">You haven&apos;t created a listing yet.</p>
          <CreateListingButton
            enabled={listingEligibility.canCreate}
            disabledReason={listingEligibility.disabledReason}
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Create Your First Listing
          </CreateListingButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {typedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              coverPhoto={coverMap[listing.id] ?? null}
              hostId={user.id}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
