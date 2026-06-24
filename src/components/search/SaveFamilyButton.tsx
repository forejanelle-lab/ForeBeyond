"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface SaveFamilyButtonProps {
  listingId: string;
  initialSaved?: boolean;
  variant?: "icon" | "button";
}

export function SaveFamilyButton({
  listingId,
  initialSaved = false,
  variant = "button",
}: SaveFamilyButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  async function toggleSave() {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/sign-in?redirect=/families/${listingId}`);
      setIsLoading(false);
      return;
    }

    if (saved) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({
        user_id: user.id,
        listing_id: listingId,
      });
      setSaved(true);
    }

    setIsLoading(false);
    router.refresh();
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleSave}
        disabled={isLoading}
        aria-label={saved ? "Remove from saved families" : "Save family"}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-dark bg-white hover:bg-sage/40 transition-colors"
      >
        <Heart className={`h-5 w-5 ${saved ? "fill-forest text-forest" : "text-charcoal-light"}`} />
      </button>
    );
  }

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="md"
      onClick={toggleSave}
      isLoading={isLoading}
      className="w-full"
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-forest" : ""}`} />
      {saved ? "Saved to favorites" : "Save to favorites"}
    </Button>
  );
}
