import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExperienceWizard } from "@/components/experiences/ExperienceWizard";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Create Experience",
  description: "Create a new local experience on Fore Beyond.",
  path: "/host/experiences/new",
});

export default async function NewExperiencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/experiences/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "role"> | null;

  if (typedProfile?.role !== "host") {
    redirect("/profile/complete");
  }

  return (
    <Container size="md" className="py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-forest">Create an experience</h1>
        <p className="mt-2 text-charcoal-light">
          Offer cultural activities travelers can book on their own schedule.
        </p>
      </div>
      <ExperienceWizard userId={user.id} />
    </Container>
  );
}
