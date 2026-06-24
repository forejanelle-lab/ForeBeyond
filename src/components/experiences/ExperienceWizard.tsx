"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_INCLUDES,
  EXPERIENCE_REQUIREMENTS,
  generateExperienceTitle,
} from "@/lib/experiences";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExperiencePhotoUpload } from "@/components/experiences/ExperiencePhotoUpload";
import type {
  ExperienceCategory,
  ExperiencePhoto,
  ExperienceStatus,
  HostExperience,
} from "@/types/database";

interface ExperienceWizardProps {
  userId: string;
  experience?: HostExperience;
  existingPhotos?: ExperiencePhoto[];
}

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function ExperienceWizard({
  userId,
  experience,
  existingPhotos = [],
}: ExperienceWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [experienceId, setExperienceId] = useState(experience?.id ?? "");
  const [category, setCategory] = useState<ExperienceCategory>(
    experience?.category ?? "cooking_class"
  );
  const [description, setDescription] = useState(experience?.description ?? "");
  const [country, setCountry] = useState(experience?.country ?? "");
  const [city, setCity] = useState(experience?.city ?? "");
  const [meetingPoint, setMeetingPoint] = useState(experience?.meeting_point ?? "");
  const [languages, setLanguages] = useState(experience?.languages?.join(", ") ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    experience?.duration_minutes != null ? String(experience.duration_minutes) : "120"
  );
  const [maxGuests, setMaxGuests] = useState(
    experience?.max_guests != null ? String(experience.max_guests) : "4"
  );
  const [pricePerPerson, setPricePerPerson] = useState(
    experience?.price_per_person != null ? String(experience.price_per_person) : ""
  );
  const [includes, setIncludes] = useState<string[]>(experience?.includes ?? []);
  const [requirements, setRequirements] = useState<string[]>(experience?.requirements ?? []);
  const [photos, setPhotos] = useState<ExperiencePhoto[]>(existingPhotos);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const steps = ["Category", "Details", "Photos", "Publish"];

  async function ensureExperienceDraft(): Promise<string | null> {
    if (experienceId) return experienceId;

    const supabase = createClient();
    const title = generateExperienceTitle(category, city, country);

    const { data, error: insertError } = await supabase
      .from("host_experiences")
      .insert({
        host_id: userId,
        title,
        description,
        category,
        country,
        city,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    setExperienceId(data.id);
    return data.id;
  }

  async function saveExperience(status: ExperienceStatus = "draft") {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const title = generateExperienceTitle(category, city, country);
    const payload = {
      title,
      description,
      category,
      country,
      city,
      meeting_point: meetingPoint.trim() || null,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      max_guests: maxGuests ? parseInt(maxGuests, 10) : 4,
      price_per_person: pricePerPerson ? parseInt(pricePerPerson, 10) : null,
      includes,
      requirements,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    if (experienceId) {
      const { error: updateError } = await supabase
        .from("host_experiences")
        .update(payload)
        .eq("id", experienceId)
        .eq("host_id", userId);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return false;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("host_experiences")
        .insert({ host_id: userId, ...payload })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return false;
      }
      setExperienceId(data.id);
    }

    setIsLoading(false);
    return true;
  }

  async function handleNext() {
    if (step === 0 && !description.trim()) {
      setError("Please describe your experience");
      return;
    }
    if (step === 0 && (!city.trim() || !country.trim())) {
      setError("City and country are required");
      return;
    }
    setError("");

    if (step === 0) {
      const ok = await saveExperience("draft");
      if (!ok) return;
    }
    if (step === 2) {
      const id = await ensureExperienceDraft();
      if (!id) return;
    }

    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function handlePublish() {
    const ok = await saveExperience("published");
    if (ok) router.push("/host/experiences");
  }

  async function handleSaveDraft() {
    const ok = await saveExperience("draft");
    if (ok) router.push("/host/experiences");
  }

  return (
    <div>
      <div className="flex justify-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-8 bg-forest" : i < step ? "w-4 bg-forest/40" : "w-4 bg-sage-dark"
              }`}
            />
            <span className={`text-xs hidden sm:inline ${i === step ? "text-forest font-medium" : "text-charcoal-light"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <Card variant="elevated" padding="lg">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Badge variant="gold" className="mb-3">
                <Sparkles className="h-3 w-3" /> Step 1
              </Badge>
              <h2 className="text-xl font-semibold text-forest">Choose your experience type</h2>
              <p className="text-sm text-charcoal-light mt-1">
                Offer cultural experiences travelers can book without staying in your home.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPERIENCE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    category === cat.value
                      ? "border-forest bg-sage/30"
                      : "border-sage-dark hover:border-forest/30"
                  }`}
                >
                  <p className="font-medium text-forest text-sm">{cat.label}</p>
                  <p className="text-xs text-charcoal-light mt-1">{cat.description}</p>
                </button>
              ))}
            </div>

            <Textarea
              label="Experience description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will travelers do, learn, and take away from this experience?"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kyoto" required />
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Japan" required />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-forest">Experience details</h2>
              <p className="text-sm text-charcoal-light mt-1">Set pricing, duration, and what travelers should know.</p>
            </div>
            <Input
              label="Meeting point"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="Nishiki Market entrance, Kyoto"
            />
            <Input
              label="Languages spoken"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Japanese..."
              hint="Separate with commas"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Duration (minutes)"
                type="number"
                min="30"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
              <Input
                label="Max guests"
                type="number"
                min="1"
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                required
              />
              <Input
                label="Price per person (USD)"
                type="number"
                min="0"
                value={pricePerPerson}
                onChange={(e) => setPricePerPerson(e.target.value)}
                placeholder="45"
              />
            </div>

            {[
              { label: "What's included", items: EXPERIENCE_INCLUDES, selected: includes, set: setIncludes },
              { label: "Requirements", items: EXPERIENCE_REQUIREMENTS, selected: requirements, set: setRequirements },
            ].map((group) => (
              <div key={group.label}>
                <p className="text-sm font-medium text-charcoal mb-2">{group.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => group.set(toggleItem(group.selected, item))}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${
                        group.selected.includes(item)
                          ? "border-forest bg-sage/30 text-forest"
                          : "border-sage-dark text-charcoal-light hover:border-forest/30"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-forest">Experience photos</h2>
              <p className="text-sm text-charcoal-light mt-1">Show what travelers can expect.</p>
            </div>
            {experienceId ? (
              <ExperiencePhotoUpload
                experienceId={experienceId}
                userId={userId}
                existingPhotos={photos}
                onPhotosChange={setPhotos}
              />
            ) : (
              <p className="text-sm text-charcoal-light">Saving draft to enable uploads...</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-forest">Review & publish</h2>
              <p className="text-sm text-charcoal-light mt-1">
                Your experience will appear in the marketplace and can be booked independently of accommodations.
              </p>
            </div>
            <div className="rounded-xl bg-sage/40 p-4 space-y-2 text-sm">
              <p><strong className="text-forest">Title:</strong> {generateExperienceTitle(category, city, country)}</p>
              <p><strong className="text-forest">Category:</strong> {EXPERIENCE_CATEGORIES.find((c) => c.value === category)?.label}</p>
              <p><strong className="text-forest">Location:</strong> {[city, country].filter(Boolean).join(", ")}</p>
              <p><strong className="text-forest">Photos:</strong> {photos.length} uploaded</p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="ghost" size="lg" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button variant="primary" size="lg" onClick={handleNext} className="flex-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="lg" onClick={handleSaveDraft} isLoading={isLoading} className="flex-1">
                Save Draft
              </Button>
              <Button variant="primary" size="lg" onClick={handlePublish} isLoading={isLoading} className="flex-1">
                Publish Experience
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
