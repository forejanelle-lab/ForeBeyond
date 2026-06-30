import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Sign Up",
  description: "Create your Fore Beyond account to travel deeper and belong anywhere.",
  path: "/auth/sign-up",
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
