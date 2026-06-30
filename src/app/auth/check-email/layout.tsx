import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Check Email",
  description: "Check your email to continue signing in to Fore Beyond.",
  path: "/auth/check-email",
});

export default function CheckEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
