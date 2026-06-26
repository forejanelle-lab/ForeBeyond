"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ListingDeleteButtonProps {
  listingId: string;
  hostId: string;
  title?: string | null;
}

export function ListingDeleteButton({ listingId, hostId, title }: ListingDeleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const label = title ?? "this listing";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setError("");
    setIsLoading(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("host_listings")
      .delete()
      .eq("id", listingId)
      .eq("host_id", hostId);

    if (deleteError) {
      setError(deleteError.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setIsLoading(false);
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        className="flex items-center justify-center gap-1.5 w-full rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isLoading ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1 text-center">{error}</p>}
    </div>
  );
}
