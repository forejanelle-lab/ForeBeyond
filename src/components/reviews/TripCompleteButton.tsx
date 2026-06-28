"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface TripCompleteButtonProps {
  tripId: string;
  userId: string;
  canComplete: boolean;
}

export function TripCompleteButton({ tripId, userId, canComplete }: TripCompleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  if (!canComplete) return null;

  async function handleComplete() {
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("complete_trip", {
      p_trip_id: tripId,
      p_user_id: userId,
    });

    if (rpcError || !data) {
      setError(rpcError?.message ?? "Unable to mark trip as complete.");
      setIsLoading(false);
      return;
    }

    setCompleted(true);
    setIsLoading(false);
    router.refresh();
  }

  if (completed) {
    return (
      <Card variant="outline" padding="md" className="bg-sage/30">
        <div className="flex items-center gap-2 text-forest">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">Trip marked complete. You and your guest can now leave reviews.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md">
      <h3 className="font-semibold text-forest mb-1">Complete your trip</h3>
      <p className="text-sm text-charcoal-light mb-4">
        Mark this stay as complete once your visit has ended to unlock mutual reviews.
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <Button variant="primary" size="sm" onClick={handleComplete} disabled={isLoading}>
        {isLoading ? "Completing…" : "Mark trip complete"}
      </Button>
    </Card>
  );
}
