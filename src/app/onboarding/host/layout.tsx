import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Host Onboarding",
  description: "Set up your host profile and listing on Fore Beyond.",
  path: "/onboarding/host",
});

export default function HostOnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
