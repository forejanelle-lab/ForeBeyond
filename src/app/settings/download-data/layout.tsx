import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Download Data",
  description: "Download a copy of your Fore Beyond account data.",
  path: "/settings/download-data",
});

export default function DownloadDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
