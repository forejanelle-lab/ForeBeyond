import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Host Dashboard",
  description: "Manage your listings, requests, and guests on Fore Beyond.",
  path: "/host/dashboard",
});

export default function HostDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
