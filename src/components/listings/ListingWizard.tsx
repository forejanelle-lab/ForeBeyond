"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Home, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  LISTING_MEALS,
  LISTING_AMENITIES,
  LISTING_ACTIVITIES,
  LISTING_HOUSE_RULES,
  defaultFamilyListingTitle,
  isListingPricingTierEnabled,
  parseListingMaxCapacity,
} from "@/lib/listings";
import {
  ONE_LISTING_PER_HOST_MESSAGE,
  isOneListingPerHostError,
} from "@/lib/host-listing-limit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/listings/PhotoUpload";
import { IntroVideoUpload } from "@/components/listings/IntroVideoUpload";
import { ListingBlockedDatesEditor } from "@/components/listings/ListingBlockedDatesEditor";
import {
  syncListingBlockedDates,
  type EditableBlockedDateRange,
} from "@/lib/listing-blocked-dates";
import type { HostListing, ListingBlockedDate, ListingContactDetails, ListingPhoto, ListingStatus } from "@/types/database";
import {
  currencyForCountry,
  getCurrencyLabel,
  normalizeCurrencyCode,
  type SupportedCurrencyCode,
} from "@/lib/currency";

interface ListingWizardProps {
  userId: string;
  hostName?: string | null;
  listing?: HostListing;
  existingPhotos?: ListingPhoto[];
  contactDetails?: Pick<ListingContactDetails, "contact_email" | "contact_address"> | null;
  existingBlockedDates?: ListingBlockedDate[];
  initialLanguagesSpoken?: string[] | null;
  initialMaxCapacity?: number | null;
  mode?: "create" | "edit";
}

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

function toggleMeal(list: string[], item: string) {
  if (item === "No Meals Included") {
    return list.includes(item) ? [] : [item];
  }

  const withoutNone = list.filter((meal) => meal !== "No Meals Included");
  return withoutNone.includes(item)
    ? withoutNone.filter((meal) => meal !== item)
    : [...withoutNone, item];
}

function hasContactDetails(email: string, address: string) {
  return email.trim().length > 0 && address.trim().length > 0;
}

function hasRequiredPricing(
  maxCapacity: number | null,
  base: string,
  tier3: string,
  tier4: string,
  tier5: string,
  tier6Plus: string
) {
  const tiers: Array<{ tier: "standard" | "3" | "4" | "5" | "6_plus"; value: string }> = [
    { tier: "standard", value: base },
    { tier: "3", value: tier3 },
    { tier: "4", value: tier4 },
    { tier: "5", value: tier5 },
    { tier: "6_plus", value: tier6Plus },
  ];

  return tiers.every(
    ({ tier, value }) => !isListingPricingTierEnabled(maxCapacity, tier) || parsePrice(value) != null
  );
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

function formatLanguagesField(languages: string[] | null | undefined): string {
  return languages?.filter(Boolean).join(", ") ?? "";
}

export function ListingWizard({
  userId,
  hostName,
  listing,
  existingPhotos = [],
  contactDetails = null,
  existingBlockedDates = [],
  initialLanguagesSpoken = null,
  initialMaxCapacity = null,
}: ListingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState(listing?.id ?? "");
  const [title, setTitle] = useState(
    listing?.title?.trim() || defaultFamilyListingTitle(hostName)
  );
  const [familyStory, setFamilyStory] = useState(listing?.family_story ?? "");
  const [stayDetails, setStayDetails] = useState(listing?.stay_details ?? "");
  const [country, setCountry] = useState(listing?.country ?? "");
  const [city, setCity] = useState(listing?.city ?? "");
  const [languages, setLanguages] = useState(
    formatLanguagesField(listing?.languages) ||
      formatLanguagesField(initialLanguagesSpoken)
  );
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
  const [maxCapacity, setMaxCapacity] = useState(() => {
    if (listing?.max_capacity != null) return String(listing.max_capacity);
    if (initialMaxCapacity != null && initialMaxCapacity > 0) return String(initialMaxCapacity);
    return "";
  });
  const [contactEmail, setContactEmail] = useState(contactDetails?.contact_email ?? "");
  const [contactAddress, setContactAddress] = useState(contactDetails?.contact_address ?? "");
  const [photos, setPhotos] = useState<ListingPhoto[]>(existingPhotos);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(listing?.intro_video_url ?? null);
  const [blockedDates, setBlockedDates] = useState<EditableBlockedDateRange[]>(
    existingBlockedDates.map((range) => ({
      id: range.id,
      start_date: range.start_date,
      end_date: range.end_date,
      note: range.note,
    }))
  );

  const hostCurrency = useMemo(
    (): SupportedCurrencyCode =>
      normalizeCurrencyCode(listing?.pricing_currency ?? currencyForCountry(country)),
    [country, listing?.pricing_currency]
  );
  const hostCurrencyLabel = getCurrencyLabel(hostCurrency);
  const rateStep = hostCurrency === "JPY" || hostCurrency === "KRW" ? "1" : "0.01";
  const ratePlaceholder =
    hostCurrency === "JPY" || hostCurrency === "KRW" ? "12000" : "85.00";
  const parsedMaxCapacity = useMemo(() => parseListingMaxCapacity(maxCapacity), [maxCapacity]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const max = parseListingMaxCapacity(maxCapacity);
    if (max == null) return;
    if (max < 3) setBudget3Guests("");
    if (max < 4) setBudget4Guests("");
    if (max < 5) setBudget5Guests("");
    if (max < 6) setBudget6PlusGuests("");
  }, [maxCapacity]);

  useEffect(() => {
    if (!introVideoUrl || !listingId) return;
    if (!photos.some((photo) => photo.is_cover)) return;

    const supabase = createClient();
    void supabase.from("listing_photos").update({ is_cover: false }).eq("listing_id", listingId);
    setPhotos((prev) => prev.map((photo) => ({ ...photo, is_cover: false })));
  }, [introVideoUrl, listingId, photos]);

  const steps = ["Family Story", "Details", "Blocked Dates", "Photos", "Publish"];

  async function handleIntroVideoChange(url: string | null) {
    setIntroVideoUrl(url);

    if (!url || !listingId) return;

    const supabase = createClient();
    await supabase.from("listing_photos").update({ is_cover: false }).eq("listing_id", listingId);
    setPhotos((prev) => prev.map((photo) => ({ ...photo, is_cover: false })));
  }

  async function ensureListingDraft(): Promise<string | null> {
    if (listingId) return listingId;

    const supabase = createClient();
    const listingTitle = title.trim() || defaultFamilyListingTitle(hostName);

    const { data: existing } = await supabase
      .from("host_listings")
      .select("id")
      .eq("host_id", userId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      setError(ONE_LISTING_PER_HOST_MESSAGE);
      return null;
    }

    const { data, error: insertError } = await supabase
      .from("host_listings")
      .insert({
        host_id: userId,
        title: listingTitle,
        family_story: familyStory,
        stay_details: stayDetails.trim() || null,
        country,
        city,
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(
        isOneListingPerHostError(insertError.message)
          ? ONE_LISTING_PER_HOST_MESSAGE
          : insertError.message
      );
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

  async function saveListing(publishStatus?: ListingStatus) {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const listingTitle = title.trim() || defaultFamilyListingTitle(hostName);
    const payload = {
      title: listingTitle,
      family_story: familyStory,
      stay_details: stayDetails.trim() || null,
      country,
      city,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      meals,
      amenities,
      family_activities: activities,
      house_rules: houseRules,
      budget_per_night: parsePrice(budgetPerNight),
      budget_per_night_3_guests: isListingPricingTierEnabled(parsedMaxCapacity, "3")
        ? parsePrice(budget3Guests)
        : null,
      budget_per_night_4_guests: isListingPricingTierEnabled(parsedMaxCapacity, "4")
        ? parsePrice(budget4Guests)
        : null,
      budget_per_night_5_guests: isListingPricingTierEnabled(parsedMaxCapacity, "5")
        ? parsePrice(budget5Guests)
        : null,
      budget_per_night_6_plus_guests: isListingPricingTierEnabled(parsedMaxCapacity, "6_plus")
        ? parsePrice(budget6PlusGuests)
        : null,
      pricing_currency: hostCurrency,
      max_capacity: parsedMaxCapacity,
      ...(publishStatus !== undefined && {
        status: publishStatus,
        published_at: publishStatus === "published" ? new Date().toISOString() : null,
      }),
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
      const { data: existing } = await supabase
        .from("host_listings")
        .select("id")
        .eq("host_id", userId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        setError(ONE_LISTING_PER_HOST_MESSAGE);
        setIsLoading(false);
        return false;
      }

      const { data, error: insertError } = await supabase
        .from("host_listings")
        .insert({
          host_id: userId,
          ...payload,
          status: publishStatus ?? "draft",
          published_at: publishStatus === "published" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(
          isOneListingPerHostError(insertError.message)
            ? ONE_LISTING_PER_HOST_MESSAGE
            : insertError.message
        );
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

  async function saveBlockedDates(activeListingId: string): Promise<boolean> {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: syncError } = await syncListingBlockedDates(
      supabase,
      activeListingId,
      blockedDates
    );

    setIsLoading(false);
    if (syncError) {
      setError(syncError);
      return false;
    }
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
    if (step === 0 && parsedMaxCapacity == null) {
      setError("Please set the maximum number of guests you can host");
      return;
    }
    if (
      step === 0 &&
      !hasRequiredPricing(
        parsedMaxCapacity,
        budgetPerNight,
        budget3Guests,
        budget4Guests,
        budget5Guests,
        budget6PlusGuests
      )
    ) {
      setError("Please set a nightly rate for each guest-count tier that applies to your max capacity");
      return;
    }
    setError("");

    if (step === 1) {
      if (meals.length === 0) {
        setError("Please select at least one meals option");
        return;
      }
      if (!hasContactDetails(contactEmail, contactAddress)) {
        setError("Contact email and address are required");
        return;
      }
      const ok = await saveListing();
      if (!ok) return;
    }
    if (step === 2) {
      const id = listingId || (await ensureListingDraft());
      if (!id) return;
      const ok = await saveBlockedDates(id);
      if (!ok) return;
    }
    if (step === 3) {
      const id = await ensureListingDraft();
      if (!id) return;
    }

    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function handlePublish() {
    const activeListingId = listingId || (await ensureListingDraft());
    if (!activeListingId) return;

    if (meals.length === 0) {
      setError("Please select at least one meals option");
      return;
    }

    if (!hasContactDetails(contactEmail, contactAddress)) {
      setError("Contact email and address are required");
      return;
    }

    if (parsedMaxCapacity == null) {
      setError("Please set the maximum number of guests you can host");
      return;
    }

    if (
      !hasRequiredPricing(
        parsedMaxCapacity,
        budgetPerNight,
        budget3Guests,
        budget4Guests,
        budget5Guests,
        budget6PlusGuests
      )
    ) {
      setError("Please set a nightly rate for each guest-count tier that applies to your max capacity");
      return;
    }

    if (!introVideoUrl) {
      const hasCover = photos.some((photo) => photo.is_cover);
      if (!hasCover) {
        setError("Upload an intro video or select a cover photo for search results");
        return;
      }
    }

    const blockedSaved = await saveBlockedDates(activeListingId);
    if (!blockedSaved) return;

    const ok = await saveListing("published");
    if (ok) router.push("/host/listings");
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 mb-8">
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
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
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
                <p className="text-sm font-medium text-forest">
                  Stay pricing <span className="text-red-600">*</span>
                </p>
                <p className="text-xs text-charcoal-light mt-1">
                  Enter amounts in <strong className="font-medium text-charcoal">{hostCurrency}</strong> ({hostCurrencyLabel}).
                  Travelers may see converted prices, but you receive payment in this currency.
                </p>
              </div>
              <Input
                label="Max guests you can host"
                type="number"
                min="1"
                max="20"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                hint="Only guest-count pricing tiers up to this number are shown below"
                required
              />
              <Input
                label={`Base nightly rate (${hostCurrency})`}
                type="number"
                min="0"
                step={rateStep}
                value={budgetPerNight}
                onChange={(e) => setBudgetPerNight(e.target.value)}
                placeholder={ratePlaceholder}
                hint="Applies to 1–2 guests"
                required
              />
              {isListingPricingTierEnabled(parsedMaxCapacity, "3") && (
                <Input
                  label={`3 guests: nightly rate (${hostCurrency})`}
                  type="number"
                  min="0"
                  step={rateStep}
                  value={budget3Guests}
                  onChange={(e) => setBudget3Guests(e.target.value)}
                  placeholder={hostCurrency === "JPY" || hostCurrency === "KRW" ? "15000" : "120.00"}
                  required
                />
              )}
              {isListingPricingTierEnabled(parsedMaxCapacity, "4") && (
                <Input
                  label={`4 guests: nightly rate (${hostCurrency})`}
                  type="number"
                  min="0"
                  step={rateStep}
                  value={budget4Guests}
                  onChange={(e) => setBudget4Guests(e.target.value)}
                  placeholder={hostCurrency === "JPY" || hostCurrency === "KRW" ? "18000" : "150.00"}
                  required
                />
              )}
              {isListingPricingTierEnabled(parsedMaxCapacity, "5") && (
                <Input
                  label={`5 guests: nightly rate (${hostCurrency})`}
                  type="number"
                  min="0"
                  step={rateStep}
                  value={budget5Guests}
                  onChange={(e) => setBudget5Guests(e.target.value)}
                  placeholder={hostCurrency === "JPY" || hostCurrency === "KRW" ? "20000" : "175.00"}
                  required
                />
              )}
              {isListingPricingTierEnabled(parsedMaxCapacity, "6_plus") && (
                <Input
                  label={`6+ guests: nightly rate (${hostCurrency})`}
                  type="number"
                  min="0"
                  step={rateStep}
                  value={budget6PlusGuests}
                  onChange={(e) => setBudget6PlusGuests(e.target.value)}
                  placeholder={hostCurrency === "JPY" || hostCurrency === "KRW" ? "24000" : "200.00"}
                  hint="Applies to groups of 6 or more guests"
                  required
                />
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-forest">What you offer</h2>
              <p className="text-sm text-charcoal-light mt-1">Select everything that applies to your home.</p>
            </div>
            <Textarea
              label="Details"
              value={stayDetails}
              onChange={(e) => setStayDetails(e.target.value)}
              placeholder="Parking instructions, check-in times, accessibility notes, neighborhood tips..."
              hint="Any additional details you want your guests to know about the stay"
            />
            {[
              { label: "Meals", items: LISTING_MEALS, selected: meals, set: setMeals, toggle: toggleMeal },
              { label: "Amenities", items: LISTING_AMENITIES, selected: amenities, set: setAmenities, toggle: toggleItem },
              { label: "Family Activities", items: LISTING_ACTIVITIES, selected: activities, set: setActivities, toggle: toggleItem },
              { label: "House Rules", items: LISTING_HOUSE_RULES, selected: houseRules, set: setHouseRules, toggle: toggleItem },
            ].map((group) => (
              <div key={group.label}>
                <p className="text-sm font-medium text-charcoal mb-2">
                  {group.label}
                  {group.label === "Meals" && <span className="text-red-600"> *</span>}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => group.set(group.toggle(group.selected, item))}
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
                <p className="text-sm font-medium text-forest">
                  Contact details <span className="text-red-600">*</span>
                </p>
                <p className="flex items-start gap-1.5 text-xs text-charcoal-light mt-1">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Required. Kept private and only shared with travelers once they book your accommodation.
                </p>
              </div>
              <Input
                label="Contact email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your.family@email.com"
                autoComplete="email"
                required
              />
              <Textarea
                label="Address"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="Street address, city, postal code, country..."
                hint="Full address for confirmed guests to coordinate arrival"
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <ListingBlockedDatesEditor ranges={blockedDates} onChange={setBlockedDates} />
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-forest">Photos &amp; intro video</h2>
              <p className="text-sm text-charcoal-light mt-1">
                Your intro video becomes the listing cover in search and on your profile. Add home
                photos so travelers can see where they will stay.
              </p>
            </div>
            {listingId ? (
              <>
                <IntroVideoUpload
                  listingId={listingId}
                  userId={userId}
                  videoUrl={introVideoUrl}
                  onVideoChange={handleIntroVideoChange}
                />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-forest">Home photos</h3>
                    <p className="text-sm text-charcoal-light mt-1">
                      Include pictures of your home and where the guest would be staying — for example
                      the guest bedroom or sleeping area, bathroom they will use, and shared spaces
                      such as the kitchen, dining area, or living room. These help travelers understand
                      what their stay will look and feel like.
                    </p>
                  </div>
                  <PhotoUpload
                    listingId={listingId}
                    userId={userId}
                    existingPhotos={photos}
                    onPhotosChange={setPhotos}
                    showCoverSelection={!introVideoUrl}
                    uploadLabel="Upload home photos"
                    uploadHint="JPEG, PNG, or WebP up to 5MB each — include the guest room and shared spaces"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-charcoal-light">Preparing uploads...</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-forest">Review & publish</h2>
              <p className="text-sm text-charcoal-light mt-1">Your listing will show your Trust Score and verification badges to travelers.</p>
            </div>
            <div className="rounded-xl bg-sage/40 p-4 space-y-2 text-sm">
              <p><strong className="text-forest">Title:</strong> {title.trim() || defaultFamilyListingTitle(hostName)}</p>
              <p><strong className="text-forest">Location:</strong> {[city, country].filter(Boolean).join(", ")}</p>
              <p><strong className="text-forest">Intro video:</strong> {introVideoUrl ? "Uploaded (used as listing cover)" : "Not set"}</p>
              <p><strong className="text-forest">Photos:</strong> {photos.length} uploaded</p>
              {!introVideoUrl && (
                <p>
                  <strong className="text-forest">Cover photo:</strong>{" "}
                  {photos.some((photo) => photo.is_cover) ? "Selected" : "Not set"}
                </p>
              )}
              <p><strong className="text-forest">Max capacity:</strong> {maxCapacity.trim() ? `${maxCapacity} guests` : "Not set"}</p>
              <p><strong className="text-forest">Contact email:</strong> {contactEmail.trim() || "Required — not set"}</p>
              <p><strong className="text-forest">Contact address:</strong> {contactAddress.trim() ? "Provided" : "Required — not set"}</p>
              <p><strong className="text-forest">Details:</strong> {stayDetails.trim() ? "Provided" : "Not set"}</p>
              <p><strong className="text-forest">Meals:</strong> {meals.length} selected</p>
              <p><strong className="text-forest">Blocked-out dates:</strong> {blockedDates.length} range{blockedDates.length !== 1 ? "s" : ""}</p>
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
            <Button variant="primary" size="lg" onClick={handlePublish} isLoading={isLoading} className="flex-1">
              Publish Listing
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
