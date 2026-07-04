"use client";

import { Suspense, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { isEmailNotConfirmedError } from "@/lib/auth-verification";
import { normalizeLoginEmail } from "@/lib/demo-credentials";
import { getPostLoginPath } from "@/lib/post-login";
import { recordLoginAudit } from "@/app/auth/actions";
import type { Profile } from "@/types/database";
import { AuthShell } from "@/components/auth/AuthShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function SignInForm() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    const authError = searchParams.get("error");
    if (authError === "verification") {
      return "That sign-in link expired or was already used. Try signing in, or request a new verification or password reset email.";
    }
    return "";
  });
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
      setError(t("auth.signInFailed"));
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

    posthog.identify(user.id, { role: (profile as { role?: string } | null)?.role ?? undefined });
    posthog.capture("sign_in_completed", { role: (profile as { role?: string } | null)?.role ?? undefined });

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
          label={t("common.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          required
        />
        <Input
          label={t("common.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.passwordPlaceholder")}
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
            <p className="mb-2">{t("auth.emailNotVerified")}</p>
            <Link
              href={`/auth/check-email?email=${encodeURIComponent(email.trim())}&resend=1`}
              className="font-medium text-forest underline hover:no-underline"
            >
              {t("auth.resendTo")} {email.trim()}
            </Link>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          {t("auth.signIn")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/auth/forgot-password" className="text-forest font-medium hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </p>

      <div className="mt-6 space-y-2 text-center text-sm text-charcoal-light">
        <div>
          {t("auth.noAccount")}{" "}
          <Link href="/auth/sign-up" className="text-forest font-medium hover:underline">
            {t("auth.createOne")}
          </Link>
        </div>
        <div>
          {t("auth.needVerify")}{" "}
          <Link href="/auth/resend-verification" className="text-forest font-medium hover:underline">
            {t("auth.resendVerification")}
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function SignInPage() {
  const t = useTranslations();

  return (
    <AuthShell
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      showLogo={false}
    >
      <Suspense
        fallback={
          <Card variant="elevated" padding="lg" className="text-center text-charcoal-light">
            {t("auth.signInLoading")}
          </Card>
        }
      >
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
