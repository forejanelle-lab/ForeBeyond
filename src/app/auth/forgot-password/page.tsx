"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { fetchPasswordResetRedirectUrl } from "@/lib/auth-email-redirect";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    const supabase = createClient();
    const redirectTo = await fetchPasswordResetRedirectUrl();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (resetError) {
      setError(formatAuthError(resetError));
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      showLogo={false}
    >
      <Card variant="elevated" padding="lg" className="shadow-xl border border-sage-dark/30">
        {success ? (
          <div className="space-y-4 text-sm text-charcoal">
            <p className="text-forest font-medium">Check your email</p>
            <p>
              If an account exists for <strong>{email.trim()}</strong>, we sent a password reset
              link. It may take a minute to arrive.
            </p>
            <Link href="/auth/sign-in" className="inline-block text-forest font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
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

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Send reset link
            </Button>
          </form>
        )}

        {!success && (
          <p className="mt-6 text-center text-sm text-charcoal-light">
            Remember your password?{" "}
            <Link href="/auth/sign-in" className="text-forest font-medium hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </Card>
    </AuthShell>
  );
}
