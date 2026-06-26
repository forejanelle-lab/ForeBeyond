"use client";

import { Globe, Home } from "lucide-react";
import type { ExperienceVisibility } from "@/types/database";
import { EXPERIENCE_VISIBILITY_OPTIONS } from "@/lib/experience-visibility";

interface ExperienceVisibilityToggleProps {
  value: ExperienceVisibility;
  onChange: (value: ExperienceVisibility) => void;
}

const OPTION_ICONS = {
  all_members: Globe,
  approved_guests_only: Home,
} as const;

export function ExperienceVisibilityToggle({ value, onChange }: ExperienceVisibilityToggleProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-forest">Who can see and book this experience?</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPERIENCE_VISIBILITY_OPTIONS.map((option) => {
          const selected = value === option.value;
          const Icon = OPTION_ICONS[option.value];

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-forest bg-sage/30 ring-1 ring-forest/20"
                  : "border-sage-dark/40 hover:border-forest/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    selected ? "bg-forest text-white" : "bg-sage/60 text-forest"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-forest">{option.title}</span>
                  <span className="block text-xs text-charcoal-light mt-1 leading-relaxed">
                    {option.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
