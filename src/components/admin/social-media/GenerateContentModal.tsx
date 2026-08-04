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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-sage-dark/20"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-dark/20 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold text-forest">Generate Monthly Content</h2>
          </div>
          <button type="button" onClick={onClose} className="text-charcoal-light hover:text-forest">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-forest mb-2">Number of posts</p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_POST_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPostCount(count)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                    postCount === count
                      ? "bg-forest text-white border-forest"
                      : "border-sage-dark/40 text-charcoal-light hover:border-forest/40"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="goal" className="text-sm font-medium text-forest">Marketing goal</label>
            <select
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as SocialMarketingGoal)}
              className="mt-1 w-full rounded-xl border border-sage-dark/50 px-3 py-2.5 text-sm"
            >
              {SOCIAL_MARKETING_GOALS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <Input label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)} required />
          <div>
            <label htmlFor="tone" className="text-sm font-medium text-forest">Tone</label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sage-dark/50 px-3 py-2.5 text-sm"
            >
              {SOCIAL_TONE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              <Sparkles className="h-4 w-4" />
              Generate content
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
