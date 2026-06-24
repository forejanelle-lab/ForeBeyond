"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  LISTING_MEALS,
  LISTING_AMENITIES,
  LISTING_ACTIVITIES,
  LISTING_HOUSE_RULES,
  generateListingTitle,
} from "@/lib/listings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/listings/PhotoUpload";
import type { HostListing, ListingPhoto, ListingStatus } from "@/types/database";

interface ListingWizardProps {
  userId: string;
  hostName?: string | null;
  listing?: HostListing;
  existingPhotos?: ListingPhoto[];
  mode?: "create" | "edit";
}

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function ListingWizard({
  userId,
  hostName,
  listing,
  existingPhotos = [],
}: ListingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState(listing?.id ?? "");
  const [familyStory, setFamilyStory] = useState(listing?.family_story ?? "");
  const [country, setCountry] = useState(listing?.country ?? "");
  const [city, setCity] = useState(listing?.city ?? "");
  const [languages, setLanguages] = useState(listing?.languages?.join(", ") ?? "");
  const [meals, setMeals] = useState<string[]>(listing?.meals ?? []);
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities ?? []);
  const [activities, setActivities] = useState<string[]>(listing?.family_activities ?? []);
  const [houseRules, setHouseRules] = useState<string[]>(listing?.house_rules ?? []);
  const [budgetPerNight, setBudgetPerNight] = useState(
    listing?.budget_per_night != null ? String(listing.budget_per_night) : ""
  );
  const [photos, setPhotos] = useState<ListingPhoto[]>(existingPhotos);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const steps = ["Family Story", "Details", "Photos", "Publish"];

  async function ensureListingDraft(): Promise<string | null> {
    if (listingId) return listingId;

    const supabase = createClient();
    const title = generateListingTitle(city, country, hostName);

    const { data, error: insertError } = await supabase
      .from("host_listings")
      .insert({
        host_id: userId,
        title,
        family_story: familyStory,
        country,
        city,
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    setListingId(data.id);
    return data.id;
  }

  async function saveListing(status: ListingStatus = "draft") {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const title = generateListingTitle(city, country, hostName);
    const payload = {
      title,
      family_story: familyStory,
      country,
      city,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      meals,
      amenities,
      family_activities: activities,
      house_rules: houseRules,
      budget_per_night: budgetPerNight ? parseInt(budgetPerNight, 10) : null,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    if (listingId) {
      const { error: updateError } = await supabase
        .from("host_listings")
        .update(payload)
        .eq("id", listingId)
        .eq("host_id", userId);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return false;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("host_listings")
        .insert({ host_id: userId, ...payload })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return false;
      }
      setListingId(data.id);
    }

    setIsLoading(false);
    return true;
  }

  async function handleNext() {
    if (step === 0 && !familyStory.trim()) {
      setError("Please share your family story");
      return;
    }
    if (step === 0 && (!city.trim() || !country.trim())) {
      setError("City and country are required");
      return;
    }
    setError("");

    if (step === 1) {
      const ok = await saveListing("draft");
      if (!ok) return;
    }
    if (step === 2) {
      const id = await ensureListingDraft();
      if (!id) return;
    }

    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function handlePublish() {
    const ok = await saveListing("published");
    if (ok) router.push("/host/listings");
  }

  async function handleSaveDraft() {
    const ok = await saveListing("draft");
    if (ok) router.push("/host/listings");
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
              <Badge variant="gold" className="mb-3"><Home className="h-3 w-3" /> Step 1</Badge>
              <h2 className="text-xl font-semibold text-forest">Tell your family&apos;s story</h2>
              <p className="text-sm text-charcoal-light mt-1">Help travelers understand who you are and what makes your home special.</p>
            </div>
            <Textarea
              label="Family Story"
              value={familyStory}
              onChange={(e) => setFamilyStory(e.target.value)}
              placeholder="Share your family's background, traditions, daily life, and what you hope to offer travelers..."
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kyoto" required />
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Japan" required />
            </div>
            <Input
              label="Languages spoken"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Japanese..."
              hint="Separate with commas"
            />
            <Input
              label="Budget per night (USD)"
              type="number"
              min="0"
              value={budgetPerNight}
              onChange={(e) => setBudgetPerNight(e.target.value)}
              placeholder="85"
              hint="Optional — helps travelers filter by budget"
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-forest">What you offer</h2>
              <p className="text-sm text-charcoal-light mt-1">Select everything that applies to your home.</p>
            </div>
            {[
              { label: "Meals", items: LISTING_MEALS, selected: meals, set: setMeals },
              { label: "Amenities", items: LISTING_AMENITIES, selected: amenities, set: setAmenities },
              { label: "Family Activities", items: LISTING_ACTIVITIES, selected: activities, set: setActivities },
              { label: "House Rules", items: LISTING_HOUSE_RULES, selected: houseRules, set: setHouseRules },
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
              <h2 className="text-xl font-semibold text-forest">Family photos</h2>
              <p className="text-sm text-charcoal-light mt-1">Show your home, family, and cultural experiences.</p>
            </div>
            {listingId ? (
              <PhotoUpload
                listingId={listingId}
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
              <p className="text-sm text-charcoal-light mt-1">Your listing will show your Trust Score and verification badges to travelers.</p>
            </div>
            <div className="rounded-xl bg-sage/40 p-4 space-y-2 text-sm">
              <p><strong className="text-forest">Title:</strong> {generateListingTitle(city, country, hostName)}</p>
              <p><strong className="text-forest">Location:</strong> {[city, country].filter(Boolean).join(", ")}</p>
              <p><strong className="text-forest">Photos:</strong> {photos.length} uploaded</p>
              <p><strong className="text-forest">Meals:</strong> {meals.length} selected</p>
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
                Publish Listing
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
