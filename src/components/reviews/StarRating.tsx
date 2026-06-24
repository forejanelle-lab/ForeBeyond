"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  readonly?: boolean;
}

export function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5" role={readonly ? "img" : "radiogroup"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const StarButton = readonly ? "span" : "button";

        return (
          <StarButton
            key={star}
            type={readonly ? undefined : "button"}
            onClick={readonly ? undefined : () => onChange?.(star)}
            disabled={readonly}
            className={
              readonly
                ? "inline-flex"
                : "inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
            }
            aria-label={readonly ? undefined : `${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`${starSize} ${filled ? "fill-gold text-gold" : "text-sage-dark/60"}`}
            />
          </StarButton>
        );
      })}
    </div>
  );
}
