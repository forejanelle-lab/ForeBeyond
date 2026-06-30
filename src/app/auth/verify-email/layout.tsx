import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Verify Email",
  description: "Verify your email address for Fore Beyond.",
  path: "/auth/verify-email",
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
