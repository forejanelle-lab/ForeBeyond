"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";

export function SearchAnalyticsTracker() {
  const searchParams = useSearchParams();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const query = searchParams.get("q") ?? "";
    const country = searchParams.get("country") ?? "";
    const city = searchParams.get("city") ?? "";

    trackEvent(AnalyticsEvents.SEARCH, {
      query,
      country,
      city,
      has_filters: Boolean(query || country || city),
    });
  }, [searchParams]);

  return null;
}
