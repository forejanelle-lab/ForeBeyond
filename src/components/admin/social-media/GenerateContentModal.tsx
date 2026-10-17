"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { currentMonthInput } from "@/lib/social-media/schedule";
import {
  SOCIAL_MARKETING_GOALS,
  SOCIAL_POST_COUNTS,
  SOCIAL_TONE_OPTIONS,
  type GenerateSocialContentInput,
  type SocialMarketingGoal,
} from "@/lib/social-media/types";

interface GenerateContentModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (input: GenerateSocialContentInput) => Promise<void>;
}

const selectClassName =
  "mt-1.5 w-full rounded-xl border border-sage-dark/25 bg-white px-3.5 py-2.5 text-sm text-charcoal-light shadow-sm focus:border-forest/30 focus:outline-none focus:ring-2 focus:ring-forest/10";

export function GenerateContentModal({ open, onClose, onGenerate }: GenerateContentModalProps) {
  const [postCount, setPostCount] = useState<number>(10);
  const [goal, setGoal] = useState<SocialMarketingGoal>("mixed");
  const [theme, setTheme] = useState("Authentic cultural immersion");
  const [tone, setTone] = useState<string>(SOCIAL_TONE_OPTIONS[0]);
  const [scheduleMonth, setScheduleMonth] = useState(currentMonthInput());
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onGenerate({
        postCount,
        goal,
        theme: theme.trim(),
        tone,
        scheduleMonth,
        additionalInstructions: additionalInstructions.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-sage-dark/15 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-sage-dark/10 bg-gradient-to-r from-white to-sage/20 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">
                  AI content studio
                </p>
              </div>
              <h2 className="mt-2 font-serif text-2xl text-forest">Generate monthly content</h2>
              <p className="mt-1 text-sm text-charcoal-light">
                Strategy, captions, hashtags, and images — scheduled across the month.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-charcoal-light hover:bg-sage/40 hover:text-forest"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <p className="text-sm font-medium text-forest">Number of posts</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SOCIAL_POST_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPostCount(count)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    postCount === count
                      ? "bg-forest text-white shadow-sm"
                      : "border border-sage-dark/20 bg-white text-charcoal-light hover:border-forest/20 hover:text-forest"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="goal" className="text-sm font-medium text-forest">
                Marketing goal
              </label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as SocialMarketingGoal)}
                className={selectClassName}
              >
                {SOCIAL_MARKETING_GOALS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tone" className="text-sm font-medium text-forest">
                Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className={selectClassName}
              >
                {SOCIAL_TONE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)} required />

          <Input
            label="Month to schedule"
            type="month"
            value={scheduleMonth}
            onChange={(e) => setScheduleMonth(e.target.value)}
            required
          />

          <Textarea
            label="Additional instructions"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Focus on authentic Japanese culture. Highlight cultural immersion and meaningful travel. Avoid sounding salesy."
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-sage-dark/10 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" isLoading={loading}>
              <Sparkles className="h-4 w-4" />
              Generate content
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
