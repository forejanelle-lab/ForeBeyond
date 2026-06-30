import { privatePageMetadata } from "@/lib/site-metadata";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export const metadata = privatePageMetadata({
  title: "Onboarding",
  description: "Complete your Fore Beyond profile setup.",
  path: "/onboarding",
});
