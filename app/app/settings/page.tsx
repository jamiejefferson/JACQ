"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/ui/section-label";
import { JBubble } from "@/components/ui/j-bubble";
import { LogoutSection } from "./logout-section";
import { createClient } from "@/lib/supabase/client";
import { getProactivityChecks, type ProactivityCheck } from "@/lib/proactivity";

type SettingsRow = {
  k: string;
  v?: string;
  c?: string;
  action?: string;
  arrow?: boolean;
  toggle?: boolean;
  mono?: boolean;
  danger?: boolean;
  onAction?: () => void;
};

async function fetchIntegrations(): Promise<Record<string, { status: string }>> {
  const res = await fetch("/api/integrations");
  if (!res.ok) return {};
  const data = await res.json();
  return data.integrations ?? {};
}

async function fetchTelegramStatus(): Promise<{ configured: boolean; username?: string }> {
  const res = await fetch("/api/integrations/telegram/status");
  if (!res.ok) return { configured: false };
  return res.json();
}

async function fetchMe(): Promise<{ preferences?: Record<string, unknown> }> {
  const res = await fetch("/api/users/me");
  if (!res.ok) return {};
  return res.json();
}

async function fetchCommunicationProfile(): Promise<Record<string, unknown>> {
  const res = await fetch("/api/communication-profile");
  if (!res.ok) return {};
  return res.json();
}

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showTelegramSetupModal, setShowTelegramSetupModal] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [telegramLinkError, setTelegramLinkError] = useState<string | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramSetupError, setTelegramSetupError] = useState<string | null>(null);
  const [telegramSetupSaving, setTelegramSetupSaving] = useState(false);
  const [registerWebhookLoading, setRegisterWebhookLoading] = useState(false);
  const [registerWebhookMessage, setRegisterWebhookMessage] = useState<string | null>(null);
  const [proactivityChecks, setProactivityChecks] = useState<ProactivityCheck[]>([]);
  const [proactivitySaving, setProactivitySaving] = useState(false);
  const { data: integrations = {}, refetch: refetchIntegrations } = useQuery({ queryKey: ["integrations"], queryFn: fetchIntegrations });
  const { data: telegramStatus = { configured: false }, refetch: refetchTelegramStatus } = useQuery({
    queryKey: ["telegram-status"],
    queryFn: fetchTelegramStatus,
  });
  const { data: me } = useQuery({ queryKey: ["users", "me"], queryFn: fetchMe });
  const { data: commProfile = {} } = useQuery({ queryKey: ["communication-profile"], queryFn: fetchCommunicationProfile });

  const userName = (me as { name?: string } | undefined)?.name;
  const defaultSignoffPa = userName ? `Jacq, ViPA to ${userName}` : "Jacq, ViPA to you";
  const defaultSignoffUser = userName ? (userName.split(" ")[0] ?? userName) : "You";

  const prefs = (me?.preferences ?? {}) as Record<string, unknown>;
  const prefsComm = (prefs.communication ?? {}) as Record<string, string>;
  const profile = (commProfile ?? {}) as Record<string, unknown>;
  const comm = {
    tone: (profile.writing_tone as string) ?? prefsComm.tone ?? "Direct, warm, no filler",
    response_length: (profile.writing_length as string) ?? prefsComm.response_length ?? "Concise",
    signoff_pa: (profile.writing_signature as string) ?? prefsComm.signoff_pa ?? defaultSignoffPa,
    signoff_user: prefsComm.signoff_user ?? defaultSignoffUser,
    language: (profile.language as string) ?? prefsComm.language ?? "British English",
  };
  const quietHours = (prefs.quiet_hours ?? { start: "08:00", end: "20:00", weekends: "off" }) as Record<string, string>;

  useEffect(() => {
    setProactivityChecks(getProactivityChecks(prefs));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefs is derived from me; we only want to sync when server preferences change
  }, [me?.preferences]);

  const updateProactivityCheck = (id: string, patch: Partial<ProactivityCheck>) => {
    setProactivityChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  async function saveProactivityChecks() {
    setProactivitySaving(true);
    try {
      const res = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proactivity_checks: proactivityChecks }),
      });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    } finally {
      setProactivitySaving(false);
    }
  }

  const intStatus = (provider: string) => (integrations[provider]?.status === "active" ? "Connected" : "Not connected");
  const intColor = (provider: string) => (integrations[provider]?.status === "active" ? "green" : "t3");

  async function connectGoogle() {
    setOauthError(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks",
          redirectTo: `${origin}/auth/callback?next=/app/settings`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setOauthError(error.message ?? "Could not start Google sign-in");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setOauthError("No redirect URL received");
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function closeTelegramModal() {
    setShowTelegramModal(false);
    setTelegramLink(null);
    setTelegramLinkError(null);
    setRegisterWebhookMessage(null);
  }

  async function registerTelegramWebhook() {
    setRegisterWebhookLoading(true);
    setRegisterWebhookMessage(null);
    try {
      const res = await fetch("/api/telegram/register-webhook", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRegisterWebhookMessage(data.error ?? "Could not register webhook");
        return;
      }
      setRegisterWebhookMessage("Webhook registered. Now open Telegram and tap Start.");
    } catch {
      setRegisterWebhookMessage("Could not register webhook");
    } finally {
      setRegisterWebhookLoading(false);
    }
  }

  function openTelegramSetup() {
    setShowTelegramSetupModal(true);
    setTelegramToken("");
    setTelegramSetupError(null);
  }

  async function saveTelegramToken() {
    const token = telegramToken.trim();
    if (!token) {
      setTelegramSetupError("Paste the token from BotFather");
      return;
    }
    setTelegramSetupSaving(true);
    setTelegramSetupError(null);
    try {
      const res = await fetch("/api/telegram/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setTelegramSetupError(res.ok ? "Could not save." : "Server error. Run the database migration for telegram_bot_config if you haven’t (see supabase/migrations).");
        return;
      }
      if (!res.ok) {
        setTelegramSetupError(data.error ?? "Could not save");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
      setShowTelegramSetupModal(false);
      setTelegramToken("");
    } catch {
      setTelegramSetupError("Could not save. Run the database migration for telegram_bot_config if you haven’t.");
    } finally {
      setTelegramSetupSaving(false);
    }
  }

  async function openTelegramConnect() {
    setShowTelegramModal(true);
    setTelegramLinkError(null);
    setTelegramLink(null);
    setTelegramLinkLoading(true);
    try {
      const res = await fetch("/api/integrations/telegram/generate-link", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTelegramLinkError(res.status === 503 ? "Set up your bot first: tap Set up next to Telegram and paste your token." : (data.error ?? "Could not get link"));
        return;
      }
      setTelegramLink(data.link ?? null);
    } catch {
      setTelegramLinkError("Could not get link");
    } finally {
      setTelegramLinkLoading(false);
    }
  }

  // Poll integrations while Connect Telegram modal is open; close when telegram becomes active
  useEffect(() => {
    if (!showTelegramModal || !telegramLink) return;
    if (integrations.telegram?.status === "active") {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setShowTelegramModal(false);
      setTelegramLink(null);
      setTelegramLinkError(null);
      return;
    }
    const interval = setInterval(() => refetchIntegrations(), 2500);
    return () => clearInterval(interval);
  }, [showTelegramModal, telegramLink, integrations.telegram?.status, queryClient, refetchIntegrations]);

  const rows: { label: string; rows: SettingsRow[] }[] = [
    {
      label: "Integrations",
      rows: [
        { k: "Gmail", v: intStatus("gmail"), c: intColor("gmail"), action: intStatus("gmail") === "Not connected" ? "Connect" : undefined, onAction: intStatus("gmail") === "Not connected" ? connectGoogle : undefined },
        { k: "Google Calendar", v: intStatus("calendar"), c: intColor("calendar"), action: intStatus("calendar") === "Not connected" ? "Connect" : undefined, onAction: intStatus("calendar") === "Not connected" ? connectGoogle : undefined },
        { k: "Google Drive", v: intStatus("drive"), c: intColor("drive"), action: intStatus("drive") === "Not connected" ? "Connect" : undefined, onAction: intStatus("drive") === "Not connected" ? connectGoogle : undefined },
        {
          k: "Telegram",
          v: !telegramStatus.configured ? "Not set up" : intStatus("telegram"),
          c: !telegramStatus.configured ? "t3" : intColor("telegram"),
          action: !telegramStatus.configured ? "Set up" : intStatus("telegram") === "Not connected" ? "Connect" : undefined,
          onAction: !telegramStatus.configured ? openTelegramSetup : intStatus("telegram") === "Not connected" ? openTelegramConnect : undefined,
        },
      ],
    },
    {
      label: "AI & Desktop",
      rows: [
        { k: "Cloud LLM", v: "Anthropic Claude", arrow: true },
        { k: "Local LLM", v: "Not set up", c: "t3" },
        { k: "Desktop app", v: "Not installed", c: "t3" },
        { k: "Browser control", v: "Enabled", c: "green" },
        { k: "Own API key", v: "Not set", c: "t3", action: "Add" },
      ],
    },
    {
      label: "Communication style",
      rows: [
        { k: "Tone", v: (comm.tone as string) ?? "Direct, warm, no filler", arrow: true },
        { k: "Response length", v: (comm.response_length as string) ?? "Concise", arrow: true },
        { k: "Sign-off (as PA)", v: (comm.signoff_pa as string) ?? defaultSignoffPa, arrow: true },
        { k: "Sign-off (as user)", v: (comm.signoff_user as string) ?? defaultSignoffUser, arrow: true },
        { k: "Language", v: (comm.language as string) ?? "British English", arrow: true },
      ],
    },
    {
      label: "Quiet hours",
      rows: [
        { k: "Start", v: (quietHours.start as string) ?? "08:00", arrow: true },
        { k: "End", v: (quietHours.end as string) ?? "20:00", arrow: true },
        { k: "Weekends", v: (quietHours.weekends as string) === "off" ? "Off (emergencies only)" : "Same as weekday", arrow: true },
      ],
    },
    {
      label: "Proactivity",
      rows: [
        { k: "Check-in times", v: "Edit below", c: "t2" },
      ],
    },
    {
      label: "Performance & feedback",
      rows: [
        { k: "Weekly review", v: "Every Friday, 17:00", arrow: true },
        { k: "Learning review", v: "Every Sunday, 19:00", arrow: true },
        { k: "Pattern learning", v: "All categories", arrow: true },
        { k: "Feedback channel", v: "Via Telegram", c: "t2" },
        { k: "Version", v: "Alpha 0.4.1", c: "t3", mono: true },
      ],
    },
    {
      label: "Privacy & data",
      rows: [
        { k: "Local-only mode", v: "Off", toggle: true },
        { k: "Data export", v: "", action: "Export" },
        { k: "Audit log", v: "", arrow: true, action: "View", onAction: () => router.push("/app/settings/audit-log") },
        { k: "Delete all data", v: "", action: "Delete", danger: true, onAction: () => setShowDeleteModal(true) },
      ],
    },
  ];

  async function handleDeleteAll() {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    if (deleteConfirm !== "DELETE") return;
    try {
      await fetch("/api/users/me", { method: "DELETE" });
      router.push("/sign-in");
      router.refresh();
    } catch {
      // show error
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      {oauthError && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-jacq-red/10 border border-jacq-red/30">
          <p className="text-[13px] text-jacq-red">{oauthError}</p>
        </div>
      )}
      {rows.map((grp) => (
        <div key={grp.label}>
          <SectionLabel>{grp.label}</SectionLabel>
          <div className="mx-4 mb-1 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
            {grp.label === "Proactivity" ? (
              <div className="p-3.5">
                <p className="text-[12px] text-jacq-t3 mb-3">Jacq checks in via Telegram at these times (tasks, commitments). Edit times or turn slots off.</p>
                {proactivityChecks.length === 0 ? (
                  <p className="text-[12px] text-jacq-t3">Loading…</p>
                ) : (
                  <>
                    {proactivityChecks.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 py-2">
                        <span className="text-[13px] text-jacq-t1 w-28">{c.label}</span>
                        <input
                          type="time"
                          value={c.time}
                          onChange={(e) => updateProactivityCheck(c.id, { time: e.target.value })}
                          className="h-9 rounded-lg border border-jacq-bord bg-jacq-surf2 px-2 text-[13px] text-jacq-t1 font-dm-mono"
                        />
                        <label className="flex items-center gap-1.5 text-[12px] text-jacq-t2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={c.enabled}
                            onChange={(e) => updateProactivityCheck(c.id, { enabled: e.target.checked })}
                            className="rounded border-jacq-bord"
                          />
                          On
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={saveProactivityChecks}
                      disabled={proactivitySaving}
                      className="mt-2 py-2 px-3 rounded-xl bg-jacq-gold text-jacq-t1 text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {proactivitySaving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              grp.rows.map((row, i) => (
                <div key={row.k}>
                  <div className="py-2.5 px-3.5 flex items-center justify-between">
                    <span className={`text-[13px] ${row.danger ? "text-jacq-red" : "text-jacq-t1"}`}>{row.k}</span>
                    <div className="flex items-center gap-1.5">
                      {row.v && (
                        <span
                          className={`text-[12px] ${
                            row.c === "green" ? "text-jacq-green" : row.c === "t3" ? "text-jacq-t3" : "text-jacq-t2"
                          } ${row.mono ? "font-dm-mono" : ""}`}
                        >
                          {row.v}
                        </span>
                      )}
                      {row.action && (
                        <button
                          type="button"
                          onClick={row.onAction}
                          className={`text-[12px] font-semibold cursor-pointer ${row.danger ? "text-jacq-red" : "text-jacq-gold"}`}
                        >
                          {row.action}
                        </button>
                      )}
                      {row.toggle && (
                        <div className="w-10 h-6 rounded-xl bg-jacq-surf2 border border-jacq-bord relative">
                          <div className="w-[18px] h-5 rounded-full bg-jacq-t3 absolute top-0.5 left-0.5" />
                        </div>
                      )}
                      {row.arrow && (
                        <svg viewBox="0 0 24 24" width={14} height={14} className="fill-jacq-t3">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                        </svg>
                      )}
                      {!row.danger && <JBubble />}
                    </div>
                  </div>
                  {i < grp.rows.length - 1 && <div className="h-px bg-jacq-bord2 mx-3.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
      <LogoutSection />
      <div className="h-5" />

      {showDeleteModal && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirm(""); }} />
          <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[81] bg-jacq-surf rounded-[14px] border border-jacq-bord p-4 shadow-lg max-w-[343px] mx-auto">
            {deleteStep === 1 ? (
              <>
                <h3 className="text-[20px] text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
                  Delete everything?
                </h3>
                <p className="text-[14px] text-jacq-t2 mb-4">
                  This will permanently delete all your data — understanding, tasks, activity, relationships, and settings. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-jacq-surf2 text-jacq-t1 text-[14px] font-semibold cursor-pointer">
                    Cancel
                  </button>
                  <button type="button" onClick={handleDeleteAll} className="flex-1 py-2.5 rounded-xl bg-jacq-red text-white text-[14px] font-semibold cursor-pointer">
                    Yes, delete my data
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[20px] text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
                  Are you absolutely sure?
                </h3>
                <p className="text-[14px] text-jacq-t2 mb-2">Type DELETE to confirm.</p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full h-11 rounded-xl border border-jacq-bord bg-jacq-surf px-3.5 text-[14px] text-jacq-t1 mb-4 font-dm-mono"
                  placeholder="DELETE"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirm(""); }} className="flex-1 py-2.5 rounded-xl bg-jacq-surf2 text-jacq-t1 text-[14px] font-semibold cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={deleteConfirm !== "DELETE"}
                    className="flex-1 py-2.5 rounded-xl bg-jacq-red text-white text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm deletion
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {showTelegramSetupModal && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => { setShowTelegramSetupModal(false); setTelegramSetupError(null); }} />
          <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[81] bg-jacq-surf rounded-[14px] border border-jacq-bord p-4 shadow-lg max-w-[343px] mx-auto max-h-[85vh] overflow-y-auto">
            <h3 className="text-[20px] text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              Set up Telegram
            </h3>
            <p className="text-[14px] text-jacq-t2 mb-3">
              So you can talk to Jacq on Telegram. Create a bot, get a token, paste it here and save.
            </p>
            <ol className="text-[13px] text-jacq-t2 space-y-2 list-decimal list-inside mb-3">
              <li>Open the <strong className="text-jacq-t1">Telegram</strong> app and search for <strong className="text-jacq-t1">@BotFather</strong>.</li>
              <li>Send <code className="bg-jacq-surf2 px-1 rounded">/newbot</code> and follow the prompts (name and username for your bot).</li>
              <li>BotFather will give you a <strong className="text-jacq-t1">token</strong>. Copy it.</li>
              <li>Paste the token below and tap <strong className="text-jacq-t1">Save</strong>.</li>
            </ol>
            <input
              type="password"
              inputMode="text"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="Paste token from BotFather"
              className="w-full h-11 rounded-xl border border-jacq-bord bg-jacq-surf px-3.5 text-[14px] text-jacq-t1 mb-2 font-dm-mono placeholder:text-jacq-t3"
            />
            {telegramSetupError && (
              <p className="text-[13px] text-jacq-red mb-2">{telegramSetupError}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowTelegramSetupModal(false); setTelegramSetupError(null); }} className="flex-1 py-2.5 rounded-xl bg-jacq-surf2 text-jacq-t1 text-[14px] font-semibold cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTelegramToken}
                disabled={telegramSetupSaving}
                className="flex-1 py-2.5 rounded-xl bg-jacq-gold text-jacq-t1 text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {telegramSetupSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </>
      )}

      {showTelegramModal && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={closeTelegramModal} />
          <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[81] bg-jacq-surf rounded-[14px] border border-jacq-bord p-4 shadow-lg max-w-[343px] mx-auto max-h-[85vh] overflow-y-auto">
            <h3 className="text-[20px] text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              Connect Telegram
            </h3>
            {telegramLinkLoading && (
              <p className="text-[14px] text-jacq-t2 mb-3">Getting your link…</p>
            )}
            {telegramLinkError && (
              <p className="text-[14px] text-jacq-t2 mb-2">{telegramLinkError}</p>
            )}
            {telegramLink && (
              <>
                <p className="text-[14px] text-jacq-t2 mb-3">
                  Connect with one tap: open the link below, then tap <strong className="text-jacq-t1">Start</strong> in the chat. No codes to type.
                </p>
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full py-3 rounded-xl bg-jacq-surf2 border border-jacq-bord text-jacq-t1 text-[14px] font-semibold text-center cursor-pointer mb-2"
                >
                  Open Telegram
                </a>
                <p className="text-[12px] text-jacq-t3 mb-3">Waiting for you to tap Start in Telegram…</p>
                <p className="text-[11px] text-jacq-t3 mb-2">
                  If nothing happens when you tap Start, Telegram can’t reach this app (e.g. on localhost). Use a public URL: run <code className="bg-jacq-surf2 px-1 rounded">ngrok http 3000</code>, open the ngrok URL in your browser, then tap Register webhook below.
                </p>
                <button
                  type="button"
                  onClick={registerTelegramWebhook}
                  disabled={registerWebhookLoading}
                  className="w-full py-2 rounded-xl border border-jacq-bord text-jacq-t2 text-[12px] font-medium cursor-pointer mb-2 disabled:opacity-50"
                >
                  {registerWebhookLoading ? "Registering…" : "Register webhook"}
                </button>
                {registerWebhookMessage && (
                  <p className={`text-[12px] mb-2 ${registerWebhookMessage.startsWith("Webhook") ? "text-jacq-green" : "text-jacq-red"}`}>
                    {registerWebhookMessage}
                  </p>
                )}
              </>
            )}
            <button type="button" onClick={closeTelegramModal} className="w-full py-2.5 rounded-xl bg-jacq-surf2 text-jacq-t1 text-[14px] font-semibold cursor-pointer">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
