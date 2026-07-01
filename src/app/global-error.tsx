"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#f9f7f2",
          color: "#333333",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#d4af37",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ margin: "0 0 0.75rem", color: "#214e34", fontSize: "1.5rem" }}>
            Fore Beyond hit an error
          </h1>
          <p style={{ margin: "0 0 2rem", color: "#555555", lineHeight: 1.6 }}>
            Refresh the page to continue. If the problem persists, try opening the site in a
            private window.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
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
