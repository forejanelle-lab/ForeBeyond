"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const DEMO_EMAIL = "demo@forebeyond.demo";
const DEMO_PASSWORD = "ForeBeyond123!";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(formatAuthError(signInError));
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
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-light">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="text-forest font-medium hover:underline">
          Create one
        </Link>
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 pt-6 border-t border-sage-dark/30">
          <p className="text-sm font-medium text-forest mb-3">Development demo account</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={fillDemoCredentials}
          >
            Use demo credentials
          </Button>
        </div>
      )}
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
