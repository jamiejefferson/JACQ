"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f5f2ec",
        color: "#1a1710",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ fontSize: 14, color: "#7a7268", marginBottom: 16, textAlign: "center" }}>
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "10px 20px",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Try again
      </button>
    </div>
  );
}
