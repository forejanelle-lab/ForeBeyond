import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExperienceWizard } from "@/components/experiences/ExperienceWizard";
import { Container } from "@/components/ui/Container";
import type { ExperiencePhoto, HostExperience, Profile } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Edit Experience",
  description: "Edit your local experience on Fore Beyond.",
  path: "/host/experiences",
});

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/host/experiences/${id}/edit`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "role"> | null;
  if (typedProfile?.role !== "host") redirect("/profile/complete");

  const [{ data: experience }, { data: photos }] = await Promise.all([
    supabase
      .from("host_experiences")
      .select("*")
      .eq("id", id)
      .eq("host_id", user.id)
      .single(),
    supabase
      .from("experience_photos")
      .select("*")
      .eq("experience_id", id)
      .order("sort_order"),
  ]);

  if (!experience) notFound();

  return (
    <Container size="md" className="py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-forest">Edit experience</h1>
        <p className="mt-2 text-charcoal-light">Update details, photos, or publish status.</p>
      </div>
      <ExperienceWizard
        userId={user.id}
        experience={experience as HostExperience}
        existingPhotos={(photos as ExperiencePhoto[]) ?? []}
      />
    </Container>
  );
}
