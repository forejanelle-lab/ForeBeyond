"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import {
  establishSessionFromAuthHash,
  establishSessionFromAuthParams,
} from "@/lib/auth-link-session";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function establishRecoverySession() {
      const supabase = createClient();

      if (searchParams.get("error") === "link_expired") {
        setError("Your reset link expired or was already used. Request a new one.");
        setIsCheckingLink(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSessionReady(true);
        setIsCheckingLink(false);
        return;
      }

      if (typeof window !== "undefined" && window.location.hash) {
        const hashResult = await establishSessionFromAuthHash(
          supabase,
          window.location.hash
        );
        if (hashResult.ok) {
          window.history.replaceState(null, "", window.location.pathname);
          setSessionReady(true);
          setIsCheckingLink(false);
          return;
        }
      }

      const paramResult = await establishSessionFromAuthParams(supabase, searchParams);
      if (paramResult.ok) {
        setSessionReady(true);
        setIsCheckingLink(false);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" && session?.user && !cancelled) {
          setSessionReady(true);
          setIsCheckingLink(false);
        }
      });
      unsubscribe = () => subscription.unsubscribe();

      await new Promise((resolve) => window.setTimeout(resolve, 400));

      if (cancelled) return;

      const { data: { user: userAfterWait } } = await supabase.auth.getUser();
      setIsCheckingLink(false);
      if (userAfterWait) {
        setSessionReady(true);
      } else {
        setError("Your reset link expired or was already used. Request a new one.");
      }
    }

    void establishRecoverySession();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Your reset link expired. Request a new one.");
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(formatAuthError(updateError));
      setIsLoading(false);
      return;
    }

    router.replace("/settings?password=updated");
    router.refresh();
  }

  if (isCheckingLink) {
    return (
      <Card variant="elevated" padding="lg" className="shadow-xl border border-sage-dark/30 text-center text-charcoal-light">
        Verifying your reset link…
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="shadow-xl border border-sage-dark/30">
      {!sessionReady ? (
        <div className="space-y-4 text-sm text-charcoal">
          <p className="text-red-600">{error || "This reset link is no longer valid."}</p>
          <Link href="/auth/forgot-password" className="inline-block text-forest font-medium hover:underline">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Update password
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your Fore Beyond account."
      showLogo={false}
    >
      <Suspense
        fallback={
          <Card variant="elevated" padding="lg" className="text-center text-charcoal-light">
            Loading…
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
