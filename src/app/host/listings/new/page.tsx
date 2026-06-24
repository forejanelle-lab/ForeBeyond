import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingWizard } from "@/components/listings/ListingWizard";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/types/database";

export const metadata = { title: "Create Listing" };

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
