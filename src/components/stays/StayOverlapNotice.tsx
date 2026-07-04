"use client";

import { AlertTriangle, Info } from "lucide-react";
import { formatDateRange } from "@/lib/stay-requests";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { OverlappingStay } from "@/lib/stay-availability";

type StayOverlapNoticeProps = {
  overlaps: OverlappingStay[];
  variant: "traveler" | "host";
};

function overlapSummary(
  overlaps: OverlappingStay[],
  t: ReturnType<typeof useTranslations>
): string {
  return overlaps
    .map((stay) => {
      const range = formatDateRange(stay.start_date, stay.end_date);
      if (stay.status === "pending") return t("overlap.pendingRequest", { range });
      if (stay.status === "host_approved") return t("overlap.approvedAwaiting", { range });
      return t("overlap.confirmedStay", { range });
    })
    .join("; ");
}

export function StayOverlapNotice({ overlaps, variant }: StayOverlapNoticeProps) {
  const t = useTranslations();
  if (overlaps.length === 0) return null;

  const summary = overlapSummary(overlaps, t);
  const isHost = variant === "host";
  const Icon = isHost ? AlertTriangle : Info;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        isHost
          ? "border-amber-300 bg-amber-50 text-charcoal"
          : "border-sage-dark/40 bg-sage/30 text-charcoal-light"
      }`}
      role="status"
    >
      <div className="flex gap-3">
        <Icon
          className={`h-5 w-5 shrink-0 mt-0.5 ${isHost ? "text-amber-700" : "text-forest"}`}
          aria-hidden
        />
        <div className="space-y-2">
          <p className="font-medium text-forest">
            {isHost ? t("overlap.hostTitle") : t("overlap.travelerTitle")}
          </p>
          <p className="leading-relaxed">
            {isHost
              ? t("overlap.hostBody", { summary })
              : t("overlap.travelerBody", { summary })}
          </p>
        </div>
      </div>
    </div>
  );
}
