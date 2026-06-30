import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingWizard } from "@/components/listings/ListingWizard";
import { Container } from "@/components/ui/Container";
import type { HostListing, ListingBlockedDate, ListingContactDetails, ListingPhoto, Profile } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Edit Listing",
  description: "Edit your host listing on Fore Beyond.",
  path: "/host/listings",
});

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/host/listings/${id}/edit`);

  const { data: listing } = await supabase
    .from("host_listings")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (!listing) notFound();

  const [{ data: photos }, { data: contactDetails }, { data: blockedDates }] = await Promise.all([
    supabase
      .from("listing_photos")
      .select("*")
      .eq("listing_id", id)
      .order("sort_order"),
    supabase
      .from("listing_contact_details")
      .select("contact_email, contact_address")
      .eq("listing_id", id)
      .maybeSingle(),
    supabase
      .from("listing_blocked_dates")
      .select("*")
      .eq("listing_id", id)
      .order("start_date", { ascending: true }),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <Container size="md" className="py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-forest">Edit listing</h1>
        <p className="mt-2 text-charcoal-light">
          Update your family story, photos, and details.
        </p>
      </div>
      <ListingWizard
        userId={user.id}
        hostName={(profile as Pick<Profile, "full_name"> | null)?.full_name}
        listing={listing as HostListing}
        existingPhotos={(photos as ListingPhoto[]) ?? []}
        contactDetails={contactDetails as Pick<ListingContactDetails, "contact_email" | "contact_address"> | null}
        existingBlockedDates={(blockedDates as ListingBlockedDate[]) ?? []}
        mode="edit"
      />
    </Container>
  );
}
