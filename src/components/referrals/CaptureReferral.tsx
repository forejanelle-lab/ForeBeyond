"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import {
  isValidReferralCode,
  normalizeReferralCode,
  REFERRAL_QUERY_PARAM,
  setStoredReferralCode,
} from "@/lib/referral";
import { createClient } from "@/lib/supabase/client";

function CaptureReferralInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const raw = searchParams.get(REFERRAL_QUERY_PARAM);
    if (!raw) return;

    const code = normalizeReferralCode(raw);
    if (!isValidReferralCode(code)) return;

    try {
      const supabase = createClient();
      void supabase
        .from("referral_links")
        .select("code")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle()
        .then(({ data }) => {
          const matched = (data as { code: string } | null)?.code;
          if (matched) setStoredReferralCode(matched);
        });
    } catch {
      // Referral capture is best-effort and must not break page load.
    }
  }, [searchParams]);

  return null;
}

export function CaptureReferral() {
  return (
    <Suspense fallback={null}>
      <CaptureReferralInner />
    </Suspense>
  );
}
