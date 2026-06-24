"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { UserRole } from "@/types/database";

const roles: { value: UserRole; label: string; description: string }[] = [
  {
    value: "traveler",
    label: "Traveler",
    description: "I want to immerse myself in local cultures and connect with host families.",
  },
  {
    value: "host",
    label: "Host",
    description: "I want to welcome travelers into my home and share my culture.",
  },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("Please choose whether you are joining as a traveler or a host");
      return;
    }

    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to complete your profile");
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        location,
        phone,
        role,
        onboarding_step: "preferences",
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    trackEvent(
      role === "host" ? AnalyticsEvents.HOST_SIGNUP : AnalyticsEvents.TRAVELER_SIGNUP,
      { role }
    );

    router.push(role === "host" ? "/onboarding/host" : "/onboarding/traveler");
  }

  return (
    <Container size="sm" className="py-16 md:py-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-forest">Complete your profile</h1>
        <p className="mt-2 text-charcoal-light">
          Tell us a bit about yourself and how you&apos;ll use {brand.name}.
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            required
          />
          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself, your interests, and what you're looking for..."
            hint="This helps families and travelers get to know you"
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <div>
            <label className="mb-3 block text-sm font-medium text-charcoal">
              I am joining as a...
            </label>
            <div className="space-y-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    role === r.value
                      ? "border-forest bg-sage/30"
                      : "border-sage-dark hover:border-forest/30"
                  }`}
                >
                  <span className="font-medium text-forest">{r.label}</span>
                  <p className="mt-1 text-sm text-charcoal-light">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Continue
          </Button>
        </form>
      </Card>
    </Container>
  );
}
