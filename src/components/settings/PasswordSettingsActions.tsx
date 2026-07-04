"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { fetchPasswordResetRedirectUrl } from "@/lib/auth-email-redirect";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";

interface PasswordSettingsActionsProps {
  email: string;
}

export function PasswordSettingsActions({ email }: PasswordSettingsActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendResetEmail() {
    if (!email.trim()) {
      setError("No email on file for this account.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

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

    setMessage(`Reset link sent to ${email.trim()}. Check your inbox.`);
    setIsLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <ButtonLink href="/settings/change-password" variant="primary" size="sm">
          Change password
        </ButtonLink>
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isLoading}
          onClick={sendResetEmail}
        >
          Email reset link
        </Button>
      </div>
      {message && <p className="text-sm text-forest">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
