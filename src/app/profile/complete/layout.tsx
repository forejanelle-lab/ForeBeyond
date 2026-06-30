import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Complete Profile",
  description: "Complete your Fore Beyond profile.",
  path: "/profile/complete",
});

export default function CompleteProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
