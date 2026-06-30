import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Dashboard",
  description: "Your Fore Beyond dashboard.",
  path: "/dashboard",
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
