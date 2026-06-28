"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

const culturalOfferings = [
  "Home-cooked meals",
  "Language exchange",
  "Local traditions",
  "Neighborhood tours",
  "Craft workshops",
  "Festival celebrations",
  "Music & storytelling",
  "Farming & gardening",
];

export default function HostOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [household, setHousehold] = useState("");
  const [experience, setExperience] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [maxGuests, setMaxGuests] = useState("1");
  const [languages, setLanguages] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function toggleOffering(offering: string) {
    setOfferings((prev) =>
      prev.includes(offering)
        ? prev.filter((o) => o !== offering)
        : [...prev, offering]
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

    const { error: insertError } = await supabase.from("host_profiles").upsert(
      {
        user_id: user.id,
        cultural_offerings: offerings,
        household_description: household,
        experience_description: experience,
        city,
        country,
        neighborhood,
        max_guests: parseInt(maxGuests, 10) || 1,
        languages_spoken: languages.split(",").map((l) => l.trim()).filter(Boolean),
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
      .update({ onboarding_step: "verification", role: "host" })
      .eq("id", user.id);

    router.push("/verification-center");
  }

  return (
    <Container size="md" className="py-16 md:py-24">
      <AuthBrandHeader />
      <div className="text-center mb-10">
        <Badge variant="gold" className="mb-4">
          <Home className="h-3 w-3" />
          Host Onboarding
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Open your home &amp; heart</h1>
        <p className="mt-2 text-charcoal-light max-w-lg mx-auto">
          Share your culture, traditions, and daily life with travelers seeking authentic connection.
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
              <h2 className="text-xl font-semibold text-forest mb-1">What can you share?</h2>
              <p className="text-sm text-charcoal-light">Select the cultural experiences you offer</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {culturalOfferings.map((offering) => (
                <button
                  key={offering}
                  type="button"
                  onClick={() => toggleOffering(offering)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                    offerings.includes(offering)
                      ? "border-forest bg-sage/30 text-forest"
                      : "border-sage-dark text-charcoal-light hover:border-forest/30"
                  }`}
                >
                  {offering}
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setStep(1)}
              disabled={offerings.length === 0}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-forest mb-1">Tell us about your home</h2>
              <p className="text-sm text-charcoal-light">Help travelers know what to expect</p>
            </div>
            <Textarea
              label="Household Description"
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
              placeholder="Describe your household — who lives there, the atmosphere, what makes it special..."
              required
            />
            <Textarea
              label="Experience Description"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="What will a typical day look like for a traveler staying with you?"
            />
            <Input
              label="Languages Spoken"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Spanish, Mandarin..."
              hint="Separate with commas"
            />
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(2)}
                disabled={!household}
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
              <h2 className="text-xl font-semibold text-forest mb-1">Location &amp; capacity</h2>
              <p className="text-sm text-charcoal-light">Where are you based?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kyoto"
                required
              />
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Japan"
                required
              />
            </div>
            <Input
              label="Neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Gion District"
            />
            <Input
              label="Maximum Guests"
              type="number"
              min="1"
              max="10"
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value)}
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
        Want to travel instead?{" "}
        <Link href="/onboarding/traveler" className="text-forest font-medium hover:underline">
          Switch to traveler onboarding
        </Link>
      </p>
    </Container>
  );
}
