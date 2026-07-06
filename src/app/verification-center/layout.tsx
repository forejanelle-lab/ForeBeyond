import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Verification Center",
  description: "Learn how Fore Beyond verifies hosts and travelers, and complete identity verification to build trust.",
  path: "/verification-center",
});

export default function VerificationCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero
        image={sampleImages.trustCenter}
        imageAlt="Identity verification at Fore Beyond"
        eyebrow="Verification Center"
        title="Verification Workflows"
        subtitle="Each step increases your Trust Score. Complete verifications to unlock the full platform."
        height="md"
      />
      {children}
    </>
  );
}
