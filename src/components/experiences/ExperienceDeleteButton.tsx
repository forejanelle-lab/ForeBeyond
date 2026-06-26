"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface ExperienceDeleteButtonProps {
  experienceId: string;
  hostId: string;
  title?: string | null;
}

export function ExperienceDeleteButton({ experienceId, hostId, title }: ExperienceDeleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const label = title ?? "this experience";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setError("");
    setIsLoading(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("host_experiences")
      .delete()
      .eq("id", experienceId)
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
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-center text-red-600 hover:text-red-700"
        onClick={handleDelete}
        isLoading={isLoading}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
