"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { fetchEmailVerificationRedirectUrl } from "@/lib/auth-email-redirect";
import { notifyNewSignup } from "@/lib/notify-signup";
import { getPostLoginPath } from "@/lib/post-login";
import { AuthShell } from "@/components/auth/AuthShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  isTravelerSignupEnabled,
  TRAVELER_SIGNUP_DISABLED_MESSAGE,
} from "@/lib/traveler-signup";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Profile } from "@/types/database";

export default function SignUpPage() {
  const router = useRouter();
  const t = useTranslations();
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

      const isNewAccount = Boolean(data.user && data.user.identities?.length !== 0);

      if (data.user) {
        posthog.identify(data.user.id, {
          name: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
        });
        posthog.capture("sign_up_submitted");
      }

      if (isNewAccount && data.user) {
        await notifyNewSignup(data.user.id);
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
      <AuthShell title={t("auth.joinTitle")} subtitle={t("brand.tagline")} showLogo={false}>
        <Card variant="elevated" padding="lg" className="text-center text-charcoal-light">
          {t("common.loading")}
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.joinTitle")}
      subtitle={t("brand.tagline")}
      showLogo={false}
    >
      <Card variant="elevated" padding="lg" className="shadow-xl border border-sage-dark/30">
        {!isTravelerSignupEnabled() && (
          <p className="mb-5 text-sm text-charcoal-light bg-sage/40 rounded-xl px-4 py-3">
            {TRAVELER_SIGNUP_DISABLED_MESSAGE} Hosts can still create an account and select{" "}
            <strong className="text-forest">Host</strong> when completing their profile.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("common.firstName")}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("auth.firstNamePlaceholder")}
              required
            />
            <Input
              label={t("common.lastName")}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("auth.lastNamePlaceholder")}
              required
            />
          </div>
          <Input
            label={t("common.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
          />
          <Input
            label={t("common.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholderSignup")}
            hint={t("auth.passwordHint")}
            minLength={8}
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            {t("auth.createAccount")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-light">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/auth/sign-in" className="text-forest font-medium hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
