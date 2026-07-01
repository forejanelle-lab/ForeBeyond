"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { fetchEmailVerificationRedirectUrl } from "@/lib/auth-email-redirect";
import { getPostLoginPath } from "@/lib/post-login";
import { AuthShell } from "@/components/auth/AuthShell";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Profile } from "@/types/database";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function redirectIfSignedIn() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsCheckingSession(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role, onboarding_step")
        .eq("id", user.id)
        .single();

      window.location.assign(
        getPostLoginPath(
          user.email ?? "",
          profile as Pick<Profile, "is_admin" | "role" | "onboarding_step"> | null
        )
      );
    }

    void redirectIfSignedIn();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user: existingUser },
      } = await supabase.auth.getUser();

      if (existingUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, role, onboarding_step")
          .eq("id", existingUser.id)
          .single();

        window.location.assign(
          getPostLoginPath(
            existingUser.email ?? "",
            profile as Pick<Profile, "is_admin" | "role" | "onboarding_step"> | null
          )
        );
        return;
      }

      const emailRedirectTo = await fetchEmailVerificationRedirectUrl();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(formatAuthError(signUpError));
        setIsLoading(false);
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        router.push(
          `/auth/check-email?email=${encodeURIComponent(email.trim())}&existing=1&resend=1`
        );
        return;
      }

      if (data.session) {
        window.location.assign("/profile/complete");
        return;
      }

      router.push(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <AuthShell title={`Join ${brand.name}`} subtitle={brand.tagline}>
        <Card variant="elevated" padding="lg" className="text-center text-charcoal-light">
          Loading...
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Join ${brand.name}`}
      subtitle={brand.tagline}
    >
      <Card variant="elevated" padding="lg" className="shadow-xl border border-sage-dark/30">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            hint="Must be at least 8 characters"
            minLength={8}
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-light">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-forest font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
