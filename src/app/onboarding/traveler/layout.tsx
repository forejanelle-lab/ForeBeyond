import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Traveler Onboarding",
  description: "Tell us about yourself to find the right host families on Fore Beyond.",
  path: "/onboarding/traveler",
});

export default function TravelerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
