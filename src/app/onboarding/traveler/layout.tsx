import { privatePageMetadata } from "@/lib/site-metadata";
import { redirect } from "next/navigation";
import { isTravelerSignupEnabled } from "@/lib/traveler-signup";

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
  if (!isTravelerSignupEnabled()) {
    redirect("/profile/complete");
  }

  return children;
}
