"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  parseCommaSeparatedList,
  TRAVELER_INTEREST_OPTIONS,
  TRAVELER_STYLE_OPTIONS,
} from "@/lib/traveler-preferences";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

export default function TravelerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState("");
  const [dietary, setDietary] = useState("");
  const [accessibility, setAccessibility] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleComplete() {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    const { error: insertError } = await supabase.from("traveler_profiles").upsert(
      {
        user_id: user.id,
        interests,
        travel_style: travelStyle,
        dietary_preferences: parseCommaSeparatedList(dietary),
        accessibility_needs: accessibility || null,
      },
      { onConflict: "user_id" }
    );

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ onboarding_step: "verification" })
      .eq("id", user.id);

    posthog.capture("traveler_onboarding_completed", {
      interest_count: interests.length,
      travel_style: travelStyle,
    });

    window.location.assign("/verification-center");
  }

  return (
    <Container size="md" className="py-16 md:py-24">
      <AuthBrandHeader />
      <div className="text-center mb-10">
        <Badge variant="gold" className="mb-4">
          <Compass className="h-3 w-3" />
          Traveler Onboarding
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Shape your journey</h1>
        <p className="mt-2 text-charcoal-light max-w-lg mx-auto">
          Help us match you with host families and experiences that resonate with who you are.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s === step ? "w-8 bg-forest" : s < step ? "w-4 bg-forest/40" : "w-4 bg-sage-dark"
            }`}
          />
        ))}
      </div>

      <Card variant="elevated" padding="lg">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-forest mb-1">What interests you?</h2>
              <p className="text-sm text-charcoal-light">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TRAVELER_INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                    interests.includes(interest)
                      ? "border-forest bg-sage/30 text-forest"
                      : "border-sage-dark text-charcoal-light hover:border-forest/30"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setStep(1)}
              disabled={interests.length === 0}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-forest mb-1">How do you like to travel?</h2>
              <p className="text-sm text-charcoal-light">Choose your preferred style</p>
            </div>
            <div className="space-y-3">
              {TRAVELER_STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setTravelStyle(style.value)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    travelStyle === style.value
                      ? "border-forest bg-sage/30"
                      : "border-sage-dark hover:border-forest/30"
                  }`}
                >
                  <span className="font-medium text-forest">{style.label}</span>
                  <p className="mt-1 text-sm text-charcoal-light">{style.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(2)}
                disabled={!travelStyle}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-forest mb-1">A few more details</h2>
              <p className="text-sm text-charcoal-light">Help hosts prepare for your visit</p>
            </div>
            <Input
              label="Dietary Preferences"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="Vegetarian, Halal, Gluten-free..."
              hint="Separate with commas"
            />
            <Textarea
              label="Accessibility Needs"
              value={accessibility}
              onChange={(e) => setAccessibility(e.target.value)}
              placeholder="Any accessibility requirements we should know about..."
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleComplete}
                isLoading={isLoading}
                className="flex-1"
              >
                Continue to Verification
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-charcoal-light">
        Not a traveler?{" "}
        <Link href="/onboarding/host" className="text-forest font-medium hover:underline">
          Switch to host onboarding
        </Link>
      </p>
    </Container>
  );
}
