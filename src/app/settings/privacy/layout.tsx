import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Privacy Settings",
  description: "Manage your privacy and data settings on Fore Beyond.",
  path: "/settings/privacy",
});

export default function PrivacySettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
