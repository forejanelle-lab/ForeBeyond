import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Trip Payment",
  description: "Complete payment for your Fore Beyond trip.",
  path: "/trips/payment",
});

export default function TripPaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
