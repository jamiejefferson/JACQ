"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", backgroundColor: "#f5f2ec", color: "#1a1710", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: "#7a7268", marginBottom: 16 }}>{error.message}</p>
        <button type="button" onClick={reset} style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
