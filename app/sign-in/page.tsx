"use client";

import { signInWithGoogle } from "./actions";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show error from callback redirect (e.g. /sign-in?error=auth)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "auth") {
      setError("Sign-in didn't complete. Check that your redirect URL is allowlisted in Supabase (see .env.local.example).");
    } else if (urlError) {
      setError("Something went wrong. Please try again.");
    }
  }, [searchParams]);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const result = await signInWithGoogle(origin);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setLoading(false);
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-jacq-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        flex: 1,
        overflowY: "auto",
        backgroundColor: "var(--jacq-bg)",
      }}
    >
      <div className="h-[46px] flex-shrink-0" style={{ height: 46, flexShrink: 0 }} aria-hidden />

      <div
        className="flex-1 flex min-h-0 flex-col items-center justify-center px-9 py-6"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 36px",
          minHeight: 0,
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: "italic",
              fontSize: "62px",
              fontWeight: 400,
              color: "var(--jacq-gold)",
              letterSpacing: "-0.025em",
              lineHeight: 1,
            }}
          >
            Jacq
          </span>
        </div>
        <div
          style={{
            width: 32,
            height: 1,
            backgroundColor: "var(--jacq-gold)",
            opacity: 0.5,
            marginBottom: 20,
          }}
        />
        <p
          style={{
            fontSize: 13,
            color: "var(--jacq-t2)",
            textAlign: "center",
            marginBottom: 48,
            maxWidth: 200,
            lineHeight: 1.75,
          }}
        >
          Your very own ViPA
        </p>
        {error && (
          <p style={{ fontSize: 14, color: "var(--jacq-red)", marginBottom: 16, textAlign: "center" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 16,
            backgroundColor: "var(--jacq-surf)",
            border: "1px solid var(--jacq-bord)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            cursor: loading ? "wait" : "pointer",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <svg viewBox="0 0 24 24" width={18} height={18}>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--jacq-t1)" }}>
            {loading ? "Redirecting…" : "Continue with Google"}
          </span>
        </button>
        <p
          style={{
            fontSize: 11,
            color: "var(--jacq-t3)",
            textAlign: "center",
            marginTop: 20,
            lineHeight: 1.75,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          Jacq only accesses what you explicitly grant. Revoke at any time.
        </p>
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: 16,
          paddingBottom: "max(env(safe-area-inset-bottom), 1.75rem)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            color: "var(--jacq-t3)",
            fontFamily: '"DM Mono", monospace',
          }}
        >
          ALPHA
        </span>
      </div>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-jacq-bg" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflowY: "auto", backgroundColor: "var(--jacq-bg)" }}>
      <div className="h-[46px] flex-shrink-0" style={{ height: 46, flexShrink: 0 }} aria-hidden />
      <div className="flex-1 flex min-h-0 flex-col items-center justify-center px-9 py-6">
        <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: "62px", color: "var(--jacq-gold)" }}>Jacq</span>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}
