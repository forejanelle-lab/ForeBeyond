import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHostListingId } from "@/lib/host-listing-limit";
import { ListingWizard } from "@/components/listings/ListingWizard";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/types/database";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "full_name" | "role"> | null;

  if (typedProfile?.role !== "host") {
    redirect("/profile/complete");
  }

  const existingListingId = await getHostListingId(supabase, user.id);
  if (existingListingId) {
    redirect(`/host/listings/${existingListingId}/edit`);
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
        mode="create"
      />
    </Container>
  );
}
