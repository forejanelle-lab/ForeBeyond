import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero
        image={sampleImages.heroFamily}
        imageAlt="Fore Beyond account settings"
        eyebrow="Settings"
        title="Your privacy, your control"
        subtitle="Manage your profile visibility, cookies, and communication preferences."
        height="md"
      />
      {children}
    </>
  );
}
