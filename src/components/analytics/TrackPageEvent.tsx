"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

interface TrackPageEventProps {
  event: AnalyticsEventName;
  data?: Record<string, string | number | boolean>;
}

export function TrackPageEvent({ event, data }: TrackPageEventProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent(event, data);
  }, [event, data]);

  return null;
}
