import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Settings",
  description: "Manage your Fore Beyond account settings.",
  path: "/settings",
});

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
