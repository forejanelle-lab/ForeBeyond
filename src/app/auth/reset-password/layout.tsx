import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Reset Password",
  description: "Set a new password for your Fore Beyond account.",
  path: "/auth/reset-password",
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
