"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { fetchEmailVerificationRedirectUrl } from "@/lib/auth-email-redirect";
import { resendVerificationEmail } from "@/lib/auth-verification";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ResendVerificationEmailProps {
  email?: string;
  autoSend?: boolean;
  showEmailField?: boolean;
}

export function ResendVerificationEmail({
  email: initialEmail = "",
  autoSend = false,
  showEmailField = false,
}: ResendVerificationEmailProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (autoSend && initialEmail && initialEmail !== "your email") {
      void handleResend(initialEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleResend(overrideEmail?: string) {
    const target = (overrideEmail ?? email).trim();
    if (!target || target === "your email") {
      setStatus("error");
      setMessage("Enter the email you used to sign up.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const supabase = createClient();
    const redirectTo = await fetchEmailVerificationRedirectUrl();
    const { error } = await resendVerificationEmail(supabase, target, redirectTo);

    if (error) {
      setStatus("error");
      setMessage(formatAuthError({ message: error }));
      return;
    }

    setStatus("sent");
    setCooldown(30);
    setMessage(
      `Verification link sent to ${target}. Open it on this phone or computer — it will not use localhost.`
    );
  }

  const canSend = email.trim().length > 0 && cooldown === 0 && status !== "sending";

  return (
    <div className="mt-4 space-y-3 text-left">
      {showEmailField && (
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "sent") setStatus("idle");
          }}
          placeholder="you@example.com"
          autoComplete="email"
        />
      )}

      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full"
        isLoading={status === "sending"}
        disabled={!canSend}
        onClick={() => handleResend()}
      >
        {cooldown > 0 ? `Resend again in ${cooldown}s` : "Resend verification email"}
      </Button>

      {message && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            status === "error" ? "bg-red-50 text-red-600" : "bg-sage/50 text-forest"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
