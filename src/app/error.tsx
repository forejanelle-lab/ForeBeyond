"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-gold mb-3">Something went wrong</p>
      <h1 className="text-2xl font-bold text-forest mb-3">We could not load this page</h1>
      <p className="text-sm text-charcoal-light mb-8">
        Try again, or return home. If this keeps happening, refresh the page or sign in again.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-light"
        >
          Try again
        </button>
        <ButtonLink href="/" variant="secondary" size="md">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
