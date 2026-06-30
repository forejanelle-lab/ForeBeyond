import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Resend Verification",
  description: "Resend your Fore Beyond email verification link.",
  path: "/auth/resend-verification",
});

export default function ResendVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
