"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Home, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  LISTING_MEALS,
  LISTING_AMENITIES,
  LISTING_ACTIVITIES,
  LISTING_HOUSE_RULES,
  defaultFamilyListingTitle,
} from "@/lib/listings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/listings/PhotoUpload";
import type { HostListing, ListingContactDetails, ListingPhoto, ListingStatus } from "@/types/database";

interface ListingWizardProps {
  userId: string;
  hostName?: string | null;
  listing?: HostListing;
  existingPhotos?: ListingPhoto[];
  contactDetails?: Pick<ListingContactDetails, "contact_email" | "contact_address"> | null;
  mode?: "create" | "edit";
}

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

function priceFieldValue(value: number | null | undefined) {
  return value != null ? String(value) : "";
}

function parsePrice(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function ListingWizard({
  userId,
  hostName,
  listing,
  existingPhotos = [],
  contactDetails = null,
}: ListingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState(listing?.id ?? "");
  const [title, setTitle] = useState(
    listing?.title?.trim() || defaultFamilyListingTitle(hostName)
  );
  const [familyStory, setFamilyStory] = useState(listing?.family_story ?? "");
  const [country, setCountry] = useState(listing?.country ?? "");
  const [city, setCity] = useState(listing?.city ?? "");
  const [languages, setLanguages] = useState(listing?.languages?.join(", ") ?? "");
  const [meals, setMeals] = useState<string[]>(listing?.meals ?? []);
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities ?? []);
  const [activities, setActivities] = useState<string[]>(listing?.family_activities ?? []);
  const [houseRules, setHouseRules] = useState<string[]>(listing?.house_rules ?? []);
  const [budgetPerNight, setBudgetPerNight] = useState(priceFieldValue(listing?.budget_per_night));
  const [budget3Guests, setBudget3Guests] = useState(priceFieldValue(listing?.budget_per_night_3_guests));
  const [budget4Guests, setBudget4Guests] = useState(priceFieldValue(listing?.budget_per_night_4_guests));
  const [budget5Guests, setBudget5Guests] = useState(priceFieldValue(listing?.budget_per_night_5_guests));
  const [budget6PlusGuests, setBudget6PlusGuests] = useState(
    priceFieldValue(listing?.budget_per_night_6_plus_guests)
  );
  const [maxCapacity, setMaxCapacity] = useState(
    listing?.max_capacity != null ? String(listing.max_capacity) : ""
  );
  const [contactEmail, setContactEmail] = useState(contactDetails?.contact_email ?? "");
  const [contactAddress, setContactAddress] = useState(contactDetails?.contact_address ?? "");
  const [photos, setPhotos] = useState<ListingPhoto[]>(existingPhotos);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const steps = ["Family Story", "Details", "Photos", "Publish"];

  async function ensureListingDraft(): Promise<string | null> {
    if (listingId) return listingId;

    const supabase = createClient();
    const listingTitle = title.trim() || defaultFamilyListingTitle(hostName);

    const { data, error: insertError } = await supabase
      .from("host_listings")
      .insert({
        host_id: userId,
        title: listingTitle,
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

  async function saveContactDetails(activeListingId: string): Promise<boolean> {
    const supabase = createClient();
    const email = contactEmail.trim() || null;
    const address = contactAddress.trim() || null;

    if (!email && !address) {
      const { error: deleteError } = await supabase
        .from("listing_contact_details")
        .delete()
        .eq("listing_id", activeListingId);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }
      return true;
    }

    const { error: upsertError } = await supabase.from("listing_contact_details").upsert(
      {
        listing_id: activeListingId,
        contact_email: email,
        contact_address: address,
      },
      { onConflict: "listing_id" }
    );

    if (upsertError) {
      setError(upsertError.message);
      return false;
    }

    return true;
  }

  async function saveListing(status: ListingStatus = "draft") {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const listingTitle = title.trim() || defaultFamilyListingTitle(hostName);
    const payload = {
      title: listingTitle,
      family_story: familyStory,
      country,
      city,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      meals,
      amenities,
      family_activities: activities,
      house_rules: houseRules,
      budget_per_night: parsePrice(budgetPerNight),
      budget_per_night_3_guests: parsePrice(budget3Guests),
      budget_per_night_4_guests: parsePrice(budget4Guests),
      budget_per_night_5_guests: parsePrice(budget5Guests),
      budget_per_night_6_plus_guests: parsePrice(budget6PlusGuests),
      max_capacity: maxCapacity.trim() ? Math.max(1, parseInt(maxCapacity, 10) || 1) : null,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    let activeListingId = listingId;

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
      activeListingId = listingId;
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
      activeListingId = data.id;
      setListingId(data.id);
    }

    const contactSaved = await saveContactDetails(activeListingId);
    if (!contactSaved) {
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  }

  async function handleNext() {
    if (step === 0 && !title.trim()) {
      setError("Please add a listing title");
      return;
    }
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
            <Input
              label="Listing title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultFamilyListingTitle(hostName)}
              hint="How your family will appear to travelers in search and on your profile"
              required
            />
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
            <div className="space-y-4 rounded-xl border border-sage-dark/40 p-4">
              <div>
                <p className="text-sm font-medium text-forest">Stay pricing</p>
                <p className="text-xs text-charcoal-light mt-1">
                  Set a nightly rate for each guest-count tier. The rate shown to travelers updates based on party size.
                </p>
              </div>
              <Input
                label="Base nightly rate (USD)"
                type="number"
                min="0"
                step="0.01"
                value={budgetPerNight}
                onChange={(e) => setBudgetPerNight(e.target.value)}
                placeholder="85.00"
              />
              <Input
                label="3 guests: nightly rate (USD)"
                type="number"
                min="0"
                step="0.01"
                value={budget3Guests}
                onChange={(e) => setBudget3Guests(e.target.value)}
                placeholder="120.00"
              />
              <Input
                label="4 guests: nightly rate (USD)"
                type="number"
                min="0"
                step="0.01"
                value={budget4Guests}
                onChange={(e) => setBudget4Guests(e.target.value)}
                placeholder="150.00"
              />
              <Input
                label="5 guests: nightly rate (USD)"
                type="number"
                min="0"
                step="0.01"
                value={budget5Guests}
                onChange={(e) => setBudget5Guests(e.target.value)}
                placeholder="175.00"
              />
              <Input
                label="6+ guests: nightly rate (USD)"
                type="number"
                min="0"
                step="0.01"
                value={budget6PlusGuests}
                onChange={(e) => setBudget6PlusGuests(e.target.value)}
                placeholder="200.00"
                hint="Applies to groups of 6 or more guests"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-forest">What you offer</h2>
              <p className="text-sm text-charcoal-light mt-1">Select everything that applies to your home.</p>
            </div>
            <Input
              label="Max capacity (guests)"
              type="number"
              min="1"
              max="20"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="6"
              hint="Maximum number of guests you can host at one time"
            />
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
            <div className="space-y-4 rounded-xl border border-sage-dark/40 p-4">
              <div>
                <p className="text-sm font-medium text-forest">Contact details</p>
                <p className="flex items-start gap-1.5 text-xs text-charcoal-light mt-1">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  This information is kept private and is only shared with travelers once they book your accommodation.
                </p>
              </div>
              <Input
                label="Contact email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your.family@email.com"
                autoComplete="email"
              />
              <Textarea
                label="Address"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="Street address, city, postal code, country..."
                hint="Full address for confirmed guests to coordinate arrival"
              />
            </div>
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
              <p><strong className="text-forest">Title:</strong> {title.trim() || defaultFamilyListingTitle(hostName)}</p>
              <p><strong className="text-forest">Location:</strong> {[city, country].filter(Boolean).join(", ")}</p>
              <p><strong className="text-forest">Photos:</strong> {photos.length} uploaded</p>
              <p><strong className="text-forest">Max capacity:</strong> {maxCapacity.trim() ? `${maxCapacity} guests` : "Not set"}</p>
              <p><strong className="text-forest">Contact email:</strong> {contactEmail.trim() || "Not set"}</p>
              <p><strong className="text-forest">Contact address:</strong> {contactAddress.trim() ? "Provided" : "Not set"}</p>
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
