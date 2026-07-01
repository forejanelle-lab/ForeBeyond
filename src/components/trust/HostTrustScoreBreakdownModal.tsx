"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchListingHostTrustScore } from "@/lib/fetch-listing-host-trust";
import { TrustScoreBreakdown } from "@/components/trust/TrustScoreBreakdown";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import type { TrustScoreBreakdown as Breakdown } from "@/lib/trust-score";
import type { TrustMetricDetails } from "@/lib/host-trust-metric-details";

interface HostTrustScoreBreakdownModalProps {
  open: boolean;
  listingId: string;
  hostName?: string | null;
  initialScore: number;
  initialBreakdown?: Breakdown | null;
  onClose: () => void;
}

export function HostTrustScoreBreakdownModal({
  open,
  listingId,
  hostName,
  initialScore,
  initialBreakdown = null,
  onClose,
}: HostTrustScoreBreakdownModalProps) {
  const [score, setScore] = useState(initialScore);
  const [breakdown, setBreakdown] = useState<Breakdown>(initialBreakdown ?? {});
  const [metricDetails, setMetricDetails] = useState<TrustMetricDetails>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hostLabel = hostName?.trim() || "This host";

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !listingId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setScore(initialScore);
    setBreakdown(initialBreakdown ?? {});

    async function loadBreakdown() {
      const supabase = createClient();
      const result = await fetchListingHostTrustScore(supabase, listingId, {
        trustScore: initialScore,
        breakdown: initialBreakdown ?? {},
        metricDetails: {},
        hostReviewSummary: null,
      });

      if (cancelled) return;

      setScore(result.trustScore);
      setBreakdown(result.breakdown);
      setMetricDetails(result.metricDetails);
      setLoading(false);
    }

    loadBreakdown().catch(() => {
      if (cancelled) return;
      setError("Unable to load this host's trust breakdown right now.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, listingId, initialScore, initialBreakdown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center py-4 sm:py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="host-trust-score-title"
          className="flex w-full max-w-lg max-h-[calc(100vh-2rem)] flex-col rounded-2xl bg-white shadow-xl border border-sage-dark/30 overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-sage-dark/20 px-5 py-4 sm:px-6">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gold mb-1">
                Host trust score
              </p>
              <h2 id="host-trust-score-title" className="text-lg font-semibold text-forest">
                {hostLabel}&apos;s score
              </h2>
              <p className="text-sm text-charcoal-light mt-1">
                This is the host&apos;s trust score — not yours. Each line shows points earned
                (for example, 15 pts from reviews means a perfect review score, not 15 reviews).
                Personal details are never shared.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 hover:bg-sage/50 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-charcoal-light" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
            <div className="flex justify-center">
              <TrustScoreRing score={score} size="sm" />
            </div>

            {loading && (
              <p className="text-sm text-charcoal-light text-center">Loading score breakdown...</p>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}

            {!loading && !error && (
              <>
                <p className="text-sm font-medium text-forest">How {hostLabel} earned their score</p>
                <TrustScoreBreakdown
                  breakdown={breakdown}
                  perspective="host-public"
                  metricDetails={metricDetails}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
