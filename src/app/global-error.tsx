"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-gold">
            Something went wrong
          </p>
          <h1 className="mb-3 text-2xl font-bold text-forest">Fore Beyond hit an error</h1>
          <p className="mb-8 text-sm leading-relaxed text-charcoal-light">
            Refresh the page to continue. If the problem persists, try opening the site in a private
            window.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-light"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
