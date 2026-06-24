"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const CONSENT_KEY = "fore-beyond-cookie-consent";

type ConsentState = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function saveConsent(consent: ConsentState) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  }

  function acceptAll() {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      consentedAt: new Date().toISOString(),
    });
  }

  function acceptEssential() {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      consentedAt: new Date().toISOString(),
    });
  }

  function saveCustom() {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      consentedAt: new Date().toISOString(),
    });
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-sage-dark/30 bg-white shadow-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-forest">We value your privacy</h3>
            <p className="mt-1 text-sm text-charcoal-light leading-relaxed">
              Fore Beyond uses essential cookies to keep you signed in. With your permission,
              we also use analytics and marketing cookies to improve your experience.{" "}
              <Link href="/privacy" className="text-forest underline">
                Privacy Policy
              </Link>
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3 border-t border-sage-dark/30 pt-4">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span><strong>Essential</strong> — Required for authentication (always on)</span>
                </label>
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="rounded text-forest"
                  />
                  <span><strong>Analytics</strong> — Help us understand how the platform is used</span>
                </label>
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="rounded text-forest"
                  />
                  <span><strong>Marketing</strong> — Personalized updates about cultural experiences</span>
                </label>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={acceptAll}>
                Accept All
              </Button>
              <Button variant="secondary" size="sm" onClick={acceptEssential}>
                Essential Only
              </Button>
              {showDetails ? (
                <Button variant="outline" size="sm" onClick={saveCustom}>
                  Save Preferences
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
                  Customize
                </Button>
              )}
            </div>
          </div>
          <button
            onClick={acceptEssential}
            className="p-1 rounded-lg hover:bg-sage/50 text-charcoal-light"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
