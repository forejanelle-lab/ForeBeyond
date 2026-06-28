"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { joinFullName, splitFullName } from "@/lib/profile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import type { UserRole } from "@/types/database";

interface ProfileSettingsFormProps {
  userId: string;
  email: string;
  initial: {
    full_name: string | null;
    bio: string | null;
    location: string | null;
    phone: string | null;
    role: UserRole | null;
    avatar_url: string | null;
    onboarding_complete: boolean;
  };
  showRolePicker?: boolean;
  redirectAfterSave?: string;
}

export function ProfileSettingsForm({
  userId,
  email,
  initial,
  showRolePicker = false,
  redirectAfterSave,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const initialNames = splitFullName(initial.full_name);
  const [firstName, setFirstName] = useState(initialNames.firstName);
  const [lastName, setLastName] = useState(initialNames.lastName);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [role, setRole] = useState<UserRole | null>(initial.role);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const lockedRole = Boolean(initial.role);
  const displayRolePicker = showRolePicker && !lockedRole;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveRole = lockedRole ? initial.role : role;

    if (!effectiveRole) {
      setError("Please choose whether you are joining as a traveler or a host");
      return;
    }

    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    const supabase = createClient();
    const updates: Record<string, unknown> = {
      full_name: joinFullName(firstName, lastName),
      bio,
      location,
      phone,
    };

    if (!lockedRole) {
      updates.role = effectiveRole;
      updates.onboarding_step = "preferences";
    }

    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    if (!lockedRole && effectiveRole) {
      trackEvent(
        effectiveRole === "host" ? AnalyticsEvents.HOST_SIGNUP : AnalyticsEvents.TRAVELER_SIGNUP,
        { role: effectiveRole }
      );
    }

    if (redirectAfterSave) {
      router.push(redirectAfterSave);
      setIsLoading(false);
      return;
    }

    if (!initial.onboarding_complete && !lockedRole) {
      router.push(effectiveRole === "host" ? "/onboarding/host" : "/onboarding/traveler");
      return;
    }

    setSuccess("Profile updated.");
    router.refresh();
    setIsLoading(false);
  }

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

  return (
    <Card variant="outline" padding="lg" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-forest">Profile</h2>
        <p className="text-sm text-charcoal-light mt-1">Update your photo and personal details.</p>
      </div>

      <ProfilePhotoUpload
        userId={userId}
        avatarUrl={avatarUrl}
        fullName={joinFullName(firstName, lastName)}
        onAvatarChange={setAvatarUrl}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            autoComplete="family-name"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-charcoal mb-1">Email</p>
          <p className="text-sm text-charcoal-light">{email}</p>
        </div>
        <Textarea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
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

        {lockedRole && initial.role && (
          <div>
            <p className="text-sm font-medium text-charcoal mb-1">Account type</p>
            <p className="text-sm text-charcoal-light capitalize">{initial.role}</p>
          </div>
        )}

        {displayRolePicker && (
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
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-forest bg-sage/50 rounded-lg px-4 py-3">{success}</p>
        )}

        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          {redirectAfterSave || initial.onboarding_complete ? "Save profile" : "Next"}
        </Button>
      </form>
    </Card>
  );
}
