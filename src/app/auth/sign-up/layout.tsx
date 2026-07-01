import { redirect } from "next/navigation";
import { getPostLoginPath } from "@/lib/post-login";
import { privatePageMetadata } from "@/lib/site-metadata";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const metadata = privatePageMetadata({
  title: "Sign Up",
  description: "Create your Fore Beyond account to travel deeper and belong anywhere.",
  path: "/auth/sign-up",
});

export default async function SignUpLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role, onboarding_step")
      .eq("id", user.id)
      .single();

    redirect(
      getPostLoginPath(
        user.email ?? "",
        profile as Pick<Profile, "is_admin" | "role" | "onboarding_step"> | null
      )
    );
  }

  return children;
}
