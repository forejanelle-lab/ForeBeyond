"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

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
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(formatAuthError(updateError));
      setIsLoading(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccess(true);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <PageShell title="Change password" subtitle="Update your sign-in password">
      <Card variant="outline" padding="lg" className="max-w-lg space-y-5">
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && (
            <p className="text-sm text-forest">Password updated successfully.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
              Save new password
            </Button>
            <Button type="button" variant="outline" size="md" onClick={() => router.push("/settings")}>
              Back to settings
            </Button>
          </div>
        </form>

        <p className="text-xs text-charcoal-light border-t border-sage-dark/20 pt-4">
          Prefer email? Use{" "}
          <Link href="/auth/forgot-password" className="text-forest font-medium hover:underline">
            forgot password
          </Link>{" "}
          on the sign-in page to reset via email instead.
        </p>
      </Card>
    </PageShell>
  );
}
