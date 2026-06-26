"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Plane } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { isEmailNotConfirmedError } from "@/lib/auth-verification";
import { DEMO_HOST, DEMO_TRAVELER } from "@/lib/demo-credentials";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function fillDemoCredentials(demo: { email: string; password: string }) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
    setNeedsVerification(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(formatAuthError(signInError));
      setNeedsVerification(isEmailNotConfirmedError(signInError.message ?? ""));
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Sign in failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const redirectParam = searchParams.get("redirect");
    const redirectTo =
      redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";

    router.refresh();
    window.location.assign(redirectTo);
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

      <div className="mt-6 pt-6 border-t border-sage-dark/30 space-y-3">
        <p className="text-sm font-medium text-forest text-center">Try a demo account</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => fillDemoCredentials(DEMO_HOST)}
          >
            <Home className="h-4 w-4 shrink-0" />
            {DEMO_HOST.shortLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => fillDemoCredentials(DEMO_TRAVELER)}
          >
            <Plane className="h-4 w-4 shrink-0" />
            {DEMO_TRAVELER.shortLabel}
          </Button>
        </div>
        <p className="text-xs text-charcoal-light text-center">
          Autofills email and password — click Sign In to continue.
        </p>
      </div>

      <div className="mt-6 space-y-2 text-center text-sm text-charcoal-light">
        <div>
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-forest font-medium hover:underline">
            Create one
          </Link>
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
