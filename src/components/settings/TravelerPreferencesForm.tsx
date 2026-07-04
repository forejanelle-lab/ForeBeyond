"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formatCommaSeparatedList,
  parseCommaSeparatedList,
  TRAVELER_INTEREST_OPTIONS,
  TRAVELER_STYLE_OPTIONS,
} from "@/lib/traveler-preferences";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import type { TravelerProfile } from "@/types/database";

interface TravelerPreferencesFormProps {
  userId: string;
  initial: Pick<
    TravelerProfile,
    "interests" | "travel_style" | "dietary_preferences" | "accessibility_needs"
  > | null;
}

export function TravelerPreferencesForm({ userId, initial }: TravelerPreferencesFormProps) {
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [travelStyle, setTravelStyle] = useState(initial?.travel_style ?? "");
  const [dietary, setDietary] = useState(formatCommaSeparatedList(initial?.dietary_preferences));
  const [accessibility, setAccessibility] = useState(initial?.accessibility_needs ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: upsertError } = await supabase.from("traveler_profiles").upsert(
      {
        user_id: userId,
        interests,
        travel_style: travelStyle || null,
        dietary_preferences: parseCommaSeparatedList(dietary),
        accessibility_needs: accessibility.trim() || null,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setIsLoading(false);
      return;
    }

    setSuccess("Travel preferences saved.");
    setIsLoading(false);
    router.refresh();
  }

  return (
    <Card variant="outline" padding="lg" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-forest">Travel preferences</h2>
        <p className="text-sm text-charcoal-light mt-1">
          Update the details you shared during onboarding. Per-stay goals are added when you request
          a stay.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-charcoal">Interests</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TRAVELER_INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  interests.includes(interest)
                    ? "border-forest bg-sage/30 text-forest"
                    : "border-sage-dark text-charcoal-light hover:border-forest/30"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-charcoal">Travel style</p>
          <div className="space-y-2">
            {TRAVELER_STYLE_OPTIONS.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setTravelStyle(style.value)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
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
        </div>

        <Input
          label="Dietary preferences"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          placeholder="Vegetarian, Halal, Gluten-free..."
          hint="Separate with commas"
        />

        <Textarea
          label="Accessibility needs"
          value={accessibility}
          onChange={(e) => setAccessibility(e.target.value)}
          placeholder="Any accessibility requirements we should know about..."
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-forest bg-sage/40 rounded-lg px-4 py-3">{success}</p>
        )}

        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          Save travel preferences
        </Button>
      </form>
    </Card>
  );
}
