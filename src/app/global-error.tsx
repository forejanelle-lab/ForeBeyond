"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9f7f2", color: "#333" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1 style={{ color: "#214e34", fontSize: "1.5rem" }}>Fore Beyond hit an error</h1>
          <p style={{ color: "#555", lineHeight: 1.6 }}>
            Refresh the page to continue. If the problem persists, try opening the site in a private window.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              border: "none",
              borderRadius: 9999,
              background: "#214e34",
              color: "#fff",
              padding: "0.65rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
