import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Trust Reviews",
  description: "Reviews and trust feedback on Fore Beyond.",
  path: "/trust-center/reviews",
});

export default function TrustReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
