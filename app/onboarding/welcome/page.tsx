"use client";

import Link from "next/link";
import { JacqLogo } from "@/components/ui/jacq-logo";

const introStyle = {
  fontFamily: '"Gilda Display", Georgia, serif',
  fontSize: 24,
  fontWeight: 400,
  color: "var(--jacq-t1)",
  lineHeight: 1.375,
} as const;

export default function OnboardingWelcomePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        flex: 1,
        overflowY: "auto",
        backgroundColor: "var(--jacq-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px 32px 32px",
          minHeight: 0,
        }}
      >
        <div style={{ marginBottom: 40, display: "flex", justifyContent: "center" }}>
          <JacqLogo size={72} />
        </div>
        <div style={{ ...introStyle, marginBottom: 10 }}>I&apos;m Jacq.</div>
        <div style={{ ...introStyle, marginBottom: 16 }}>
          I&apos;m going to handle your admin, protect your time, and follow up on everything you forget to chase.
        </div>
        <div style={{ ...introStyle, marginBottom: 16 }}>
          You don&apos;t need to open an app. I&apos;ll come to you.
        </div>
        <div style={{ ...introStyle, marginBottom: 24 }}>Let&apos;s get started →</div>
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: "16px 24px",
          paddingBottom: "max(env(safe-area-inset-bottom), 2rem)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Link
          href="/onboarding/llm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 50,
            borderRadius: 14,
            backgroundColor: "var(--jacq-t1)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
            border: "none",
          }}
        >
          Let&apos;s get started →
        </Link>
        <Link
          href="/onboarding/llm"
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--jacq-t3)",
            textDecoration: "none",
          }}
        >
          Skip intro
        </Link>
      </div>
    </div>
  );
}
