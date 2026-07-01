"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TravelerSignupLink } from "@/components/auth/TravelerSignupButton";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { isEmailNotConfirmedError } from "@/lib/auth-verification";
import { normalizeLoginEmail } from "@/lib/demo-credentials";
import { getPostLoginPath } from "@/lib/post-login";
import { recordLoginAudit } from "@/app/auth/actions";
import type { Profile } from "@/types/database";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithCredentials(rawEmail: string, rawPassword: string) {
    setError("");
    setNeedsVerification(false);
    setIsLoading(true);

    const supabase = createClient();
    const normalizedEmail = normalizeLoginEmail(rawEmail);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: rawPassword,
    });

    if (signInError) {
      setError(formatAuthError(signInError));
      setNeedsVerification(isEmailNotConfirmedError(signInError.message ?? ""));
      setIsLoading(false);
      return;
    }

    const user = data.user;
    if (!user || !data.session) {
      setError("Sign in failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    const redirectParam = searchParams.get("redirect");
    const redirectTo = getPostLoginPath(
      user.email ?? normalizedEmail,
      profile as Pick<Profile, "is_admin" | "role"> | null,
      redirectParam
    );

    void recordLoginAudit("password");
    window.location.assign(redirectTo);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWithCredentials(email, password);
  }

  return (
    <Card variant="elevated" padding="lg" className="shadow-xl border border-sage-dark/30">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3" role="alert">
            {error}
          </div>
        )}

        {needsVerification && email.trim() && (
          <div className="rounded-lg bg-sage/40 px-4 py-3 text-sm text-charcoal">
            <p className="mb-2">Your email isn&apos;t verified yet.</p>
            <Link
              href={`/auth/check-email?email=${encodeURIComponent(email.trim())}&resend=1`}
              className="font-medium text-forest underline hover:no-underline"
            >
              Resend verification link to {email.trim()}
            </Link>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-charcoal-light">
        <div>
          Don&apos;t have an account?{" "}
          <TravelerSignupLink className="text-forest font-medium hover:underline">
            Create one
          </TravelerSignupLink>
        </div>
        <div>
          Need to verify your email?{" "}
          <Link href="/auth/resend-verification" className="text-forest font-medium hover:underline">
            Resend verification link
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your journey with verified host families and meaningful cultural connection."
    >
      <Suspense
        fallback={
          <Card variant="elevated" padding="lg" className="text-center text-charcoal-light">
            Loading sign in...
          </Card>
        }
      >
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
