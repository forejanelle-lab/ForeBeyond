"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { markExitIntentShown, markExitIntentSubmitted } from "@/lib/exit-intent-storage";
import type { ExitIntentInterest } from "@/types/database";

const INTEREST_OPTIONS: { value: ExitIntentInterest; label: string; emoji: string }[] = [
  { value: "hosting", label: "Hosting Travelers", emoji: "🌍" },
  { value: "traveling", label: "Traveling", emoji: "✈️" },
  { value: "both", label: "Both", emoji: "🤝" },
];

interface ExitIntentModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExitIntentModal({ open, onClose }: ExitIntentModalProps) {
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<ExitIntentInterest | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  function handleClose() {
    markExitIntentShown();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!interest) {
      setError("Please select how you would like to stay connected.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/exit-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, interest }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      markExitIntentSubmitted();
      setSuccess(true);
      setIsLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest/40 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-label="Close dialog"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#F9F7F2] shadow-xl border border-sage-dark/30 p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-charcoal-light hover:bg-white/70 hover:text-forest transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="pr-8 space-y-3">
            <h2 id="exit-intent-title" className="text-2xl font-semibold text-forest">
              You&apos;re on the list!
            </h2>
            <p className="text-sm sm:text-base text-charcoal-light leading-relaxed">
              Thanks for joining the Fore Beyond community. We&apos;ll keep you updated as we grow and
              launch new opportunities around the world.
            </p>
            <Button variant="primary" size="md" onClick={handleClose} className="mt-4 w-full sm:w-auto">
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="pr-8 mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/70 mb-2">
                Before you go...
              </p>
              <h2 id="exit-intent-title" className="text-2xl sm:text-3xl font-semibold text-forest">
                Stay connected with Fore Beyond.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-charcoal-light leading-relaxed">
                Be the first to hear about new destinations, launch updates, and opportunities to host
                or travel with our growing community.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                className="bg-white"
              />

              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-charcoal">
                  I&apos;m interested in
                </legend>
                <div className="space-y-2">
                  {INTEREST_OPTIONS.map((option) => {
                    const selected = interest === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                          selected
                            ? "border-forest bg-white shadow-sm"
                            : "border-sage-dark/50 bg-white/80 hover:border-forest/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="exit-intent-interest"
                          value={option.value}
                          checked={selected}
                          onChange={() => setInterest(option.value)}
                          className="h-4 w-4 accent-[#214E34]"
                        />
                        <span className="text-base leading-none" aria-hidden="true">
                          {option.emoji}
                        </span>
                        <span className="text-sm font-medium text-charcoal">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="space-y-3 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full bg-[#214E34] hover:bg-forest-light"
                >
                  Keep Me Updated
                </Button>
                <p className="text-center text-xs text-charcoal-light">No spam. Unsubscribe anytime.</p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
