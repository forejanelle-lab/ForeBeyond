import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Sign In",
  description: "Sign in to your Fore Beyond account.",
  path: "/auth/sign-in",
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
