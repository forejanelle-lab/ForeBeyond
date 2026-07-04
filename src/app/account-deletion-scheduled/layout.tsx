import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Account Deletion Scheduled",
  description: "Your Fore Beyond account deletion has been scheduled.",
  path: "/account-deletion-scheduled",
});

export default function AccountDeletionScheduledLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
