import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Stay Requests",
  description: "View your stay requests on Fore Beyond.",
  path: "/dashboard/requests",
});

export default function DashboardRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
