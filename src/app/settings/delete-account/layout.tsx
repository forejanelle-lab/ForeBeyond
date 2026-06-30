import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Delete Account",
  description: "Delete your Fore Beyond account and personal data.",
  path: "/settings/delete-account",
});

export default function DeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
