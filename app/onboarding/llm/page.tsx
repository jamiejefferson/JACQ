"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JacqLogo } from "@/components/ui/jacq-logo";

type Choice = "own" | "local";

type ModelOption = { id: string; display_name: string };

export default function OnboardingLLMPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>("own");
  const [provider, setProvider] = useState<"anthropic" | "google">("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [keyValidating, setKeyValidating] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [localConnected, setLocalConnected] = useState<boolean | null>(null);
  const [localChecking, setLocalChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function validateKey() {
    if (!apiKey.trim()) return;
    setKeyValidating(true);
    setKeyValid(null);
    setModels([]);
    setSelectedModel("");
    try {
      const res = await fetch("/api/llm/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: apiKey.trim() }),
      });
      const data = await res.json();
      setKeyValid(data.valid === true);
      if (data.valid === true && Array.isArray(data.models) && data.models.length > 0) {
        setModels(data.models);
        const preferred = data.models.find((m: ModelOption) => m.id.includes("haiku")) ?? data.models[0];
        setSelectedModel(preferred.id);
      }
    } catch {
      setKeyValid(false);
    } finally {
      setKeyValidating(false);
    }
  }

  async function checkLocal() {
    setLocalChecking(true);
    setLocalConnected(null);
    try {
      const res = await fetch("/api/llm/local-status");
      const data = await res.json();
      setLocalConnected(data.connected === true);
    } catch {
      setLocalConnected(false);
    } finally {
      setLocalChecking(false);
    }
  }

  const canContinue =
    (choice === "own" && keyValid === true) ||
    (choice === "local" && localConnected === true);

  async function handleContinue() {
    if (!canContinue || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        provider: choice === "own" ? provider : "local",
        fallback_to_jacq: false,
      };
      if (choice === "own" && apiKey.trim()) body.api_key = apiKey.trim();
      if (choice === "own" && provider === "anthropic" && selectedModel) body.model = selectedModel;
      const res = await fetch("/api/llm/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(typeof data.error === "string" ? data.error : "Failed to save");
        setSaving(false);
        return;
      }
      router.push("/onboarding/conversation");
    } catch {
      setSaveError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-jacq-bg">
      <div className="py-2.5 px-[18px] border-b border-jacq-bord flex items-center flex-shrink-0">
        <JacqLogo size={26} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}>
        <div className="px-6 pt-6 pb-4 text-center">
          <h1
            className="text-[22px] text-jacq-t1 leading-snug mb-3"
            style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
          >
            Before we talk, let&apos;s get your AI sorted.
          </h1>
          <p className="text-[14px] text-jacq-t2 max-w-[300px] mx-auto">
            Jacq uses an AI model to think. Bring your own API key or run one locally.
          </p>
        </div>

        <div className="px-4 space-y-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setChoice("own")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setChoice("own"); } }}
            className={`w-full text-left rounded-[14px] border p-4 transition-colors cursor-pointer ${
              choice === "own" ? "bg-jacq-goldl border-jacq-goldb" : "bg-jacq-surf border-jacq-bord"
            }`}
          >
            <span className="text-[16px] font-medium text-jacq-t1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              Your own API key
            </span>
            <p className="text-[13px] text-jacq-t2 mt-1">Use your Anthropic (Claude) or Google key.</p>
            {choice === "own" && (
              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-wrap items-center gap-3">
                  {(["anthropic", "google"] as const).map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-[13px] text-jacq-t2 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        checked={provider === p}
                        onChange={() => {
                          setProvider(p);
                          setModels([]);
                          setSelectedModel("");
                        }}
                        className="rounded-full"
                      />
                      {p === "anthropic" ? "Claude" : "Google"}
                    </label>
                  ))}
                  {provider === "anthropic" && (
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-jacq-gold underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get your API key
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setKeyValid(null); }}
                    onBlur={() => apiKey.trim() && validateKey()}
                    placeholder="API key"
                    className="flex-1 h-10 rounded-lg border border-jacq-bord bg-jacq-bg px-3 text-[13px] font-mono text-jacq-t1 placeholder:text-jacq-t3"
                  />
                  <button
                    type="button"
                    onClick={validateKey}
                    disabled={!apiKey.trim() || keyValidating}
                    className="h-10 px-3 rounded-lg bg-jacq-surf2 border border-jacq-bord text-[13px] text-jacq-t1 disabled:opacity-50"
                  >
                    {keyValidating ? "…" : "Validate"}
                  </button>
                </div>
                {keyValid === true && (
                  <>
                    <p className="text-[12px] text-jacq-green">Key valid</p>
                    {provider === "anthropic" && models.length > 0 && (
                      <div className="mt-2">
                        <label className="block text-[12px] text-jacq-t2 mb-1">Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full h-10 rounded-lg border border-jacq-bord bg-jacq-bg px-3 text-[13px] text-jacq-t1"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.display_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                {keyValid === false && <p className="text-[12px] text-red-500">That key doesn&apos;t seem to work.</p>}
              </div>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setChoice("local")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setChoice("local"); } }}
            className={`w-full text-left rounded-[14px] border p-4 transition-colors cursor-pointer ${
              choice === "local" ? "bg-jacq-goldl border-jacq-goldb" : "bg-jacq-surf border-jacq-bord"
            }`}
          >
            <span className="text-[16px] font-medium text-jacq-t1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              Run locally (coming soon)
            </span>
            <p className="text-[13px] text-jacq-t2 mt-1">Maximum privacy. Requires the Jacq desktop app. Not set up yet.</p>
            {choice === "local" && (
              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                <a
                  href="#"
                  className="text-[13px] text-jacq-gold underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Download desktop app
                </a>
                <button
                  type="button"
                  onClick={checkLocal}
                  disabled={localChecking}
                  className="block h-10 px-3 rounded-lg bg-jacq-surf2 border border-jacq-bord text-[13px] text-jacq-t1 disabled:opacity-50"
                >
                  {localChecking ? "Checking…" : "I&apos;ve installed it"}
                </button>
                {localConnected === true && <p className="text-[12px] text-jacq-green">Connected</p>}
                {localConnected === false && (
                  <p className="text-[12px] text-jacq-t3">Desktop app not detected — make sure it&apos;s running.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-jacq-bord">
        {saveError && (
          <p className="text-[12px] text-jacq-red mb-2 text-center">{saveError}</p>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || saving}
          className="w-full h-[50px] rounded-[14px] bg-jacq-t1 border-none text-white text-[14px] font-semibold cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
