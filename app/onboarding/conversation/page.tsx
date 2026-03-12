"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JacqLogo } from "@/components/ui/jacq-logo";
import { SavedPanel } from "@/components/saved-panel";

type Message = {
  role: "j" | "u";
  text: string;
  saved?: { label: string; section?: string }[];
  toolErrorReasons?: string[];
  isJumpOffSummary?: boolean;
};

/** Strip markdown-style ** so it doesn't show as literal; keep plain text only. */
function plainText(s: string): string {
  return s.replace(/\*\*/g, "").trim() || s;
}

/** Parse jump-off summary into "learned" and "still to know" bullet lists. */
function parseJumpOffSummary(
  text: string
): { learned: string[]; stillToKnow: string[]; closing?: string } | null {
  const raw = plainText(text);
  const learned: string[] = [];
  const stillToKnow: string[] = [];
  const bulletStart = /^[\s]*[-•*]\s+/;
  const isBullet = (line: string) => bulletStart.test(line) || /^[\s]*\d+\.\s+/.test(line);
  const trimBullet = (line: string) => line.replace(bulletStart, "").replace(/^\s*\d+\.\s+/, "").trim();

  const lower = raw.toLowerCase();
  const learnedMarker =
    lower.includes("here's what i've learned") ||
    lower.includes("here is what i've learned") ||
    lower.includes("what i've learned so far");
  const stillMarker =
    lower.includes("what i'd still like to know") ||
    lower.includes("what i would still like to know") ||
    lower.includes("still like to know");

  if (!learnedMarker && !stillMarker) return null;

  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  let phase: "learned" | "still" | "closing" = learnedMarker ? "learned" : "still";
  const closingLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    if (
      phase === "learned" &&
      (lineLower.includes("what i'd still like to know") || lineLower.includes("what i would still like to know"))
    ) {
      phase = "still";
      continue;
    }
    if (phase === "learned" && isBullet(line)) {
      const t = trimBullet(line);
      if (t.length) learned.push(t);
      continue;
    }
    if (phase === "still" && isBullet(line)) {
      const t = trimBullet(line);
      if (t.length) stillToKnow.push(t);
      continue;
    }
    if (phase === "still" && line.length > 60 && !isBullet(line)) {
      phase = "closing";
    }
    if (phase === "closing") closingLines.push(line);
  }

  const closing = closingLines.length ? closingLines.join(" ").trim() : undefined;
  if (learned.length === 0 && stillToKnow.length === 0) return null;
  return { learned, stillToKnow, closing };
}

function JumpOffSummaryCard({
  learned,
  stillToKnow,
  closing,
}: {
  learned: string[];
  stillToKnow: string[];
  closing?: string;
}) {
  return (
    <div className="rounded-xl border border-jacq-bord bg-jacq-surf p-4 shadow-sm max-w-[90%]">
      <div className="text-[14px] font-semibold text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
        Here&apos;s what I&apos;ve learned so far
      </div>
      <ul className="list-none space-y-1.5 mb-4">
        {learned.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-[13px] text-jacq-t1">
            <span className="text-jacq-green flex-shrink-0 mt-0.5" aria-hidden>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="text-[14px] font-semibold text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
        What I&apos;d still like to know to help you best
      </div>
      <ul className="list-none space-y-1.5">
        {stillToKnow.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-[13px] text-jacq-t1">
            <span className="text-jacq-green flex-shrink-0 mt-0.5" aria-hidden>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {closing && (
        <p className="mt-3 text-[12px] text-jacq-t2 border-t border-jacq-bord2 pt-3">{closing}</p>
      )}
    </div>
  );
}

export default function OnboardingConversationPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [completionSuggested, setCompletionSuggested] = useState(false);
  const [streamingSaved, setStreamingSaved] = useState<{ label?: string; section?: string }[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [jumpOffSummaryShown, setJumpOffSummaryShown] = useState(false);
  const [jumpOffLoading, setJumpOffLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/onboarding/session");
        const data = await res.json();
        if (res.ok && data.sessionId) {
          setSessionId(data.sessionId);
          const msgs = (data.messages ?? []) as Array<{ role: string; content: string }>;
          if (msgs.length > 0) {
            const converted: Message[] = msgs.map((m) =>
              m.role === "user"
                ? { role: "u", text: m.content }
                : { role: "j", text: m.content }
            );
            setMessages(converted);
          } else {
            setMessages([
              {
                role: "j",
                text: "Before I get started, I'd like to ask you a few things so I can help you better. It'll only take a couple of minutes, and everything you tell me I'll remember. You can jump off whenever you like; we can get to know each other better later.",
              },
            ]);
          }
        } else {
        setMessages([
          {
            role: "j",
            text: "Before I get started, I'd like to ask you a few things so I can help you better. It'll only take a couple of minutes, and everything you tell me I'll remember. You can jump off whenever you like; we can get to know each other better later.",
          },
        ]);
      }
    } catch {
      setMessages([
        {
          role: "j",
          text: "Before I get started, I'd like to ask you a few things so I can help you better. It'll only take a couple of minutes, and everything you tell me I'll remember. You can jump off whenever you like; we can get to know each other better later.",
        },
      ]);
      } finally {
        setLoadingSession(false);
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, streamingSaved, streamingContent]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "u", text }]);
    setLoading(true);
    setStreamingSaved([]);
    setStreamingContent("");

    const history = messages
      .filter((m) => m.role === "j" || m.role === "u")
      .map((m) => ({ role: m.role === "u" ? "user" : "assistant", content: m.text }));
    history.push({ role: "user", content: text });

    try {
      const res = await fetch("/api/onboarding/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, messages: history.slice(0, -1) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");
      let buffer = "";
      const saved: { label?: string; section?: string }[] = [];
      const toolErrorReasons: string[] = [];
      let content = "";
      let completionSuggestedEvent = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as {
              type: string;
              tool?: string;
              label?: string;
              section?: string;
              text?: string;
              sessionId?: string;
              completionSuggested?: boolean;
              ok?: boolean;
              reason?: string;
            };
            if (event.type === "tool_result" && event.tool === "extract_understanding") {
              if (event.ok === false && event.reason) {
                toolErrorReasons.push(event.reason);
              } else {
                saved.push({ label: event.label, section: event.section });
                setStreamingSaved([...saved]);
              }
            } else if (event.type === "content" && event.text != null) {
              content = event.text;
              setStreamingContent(content);
            } else if (event.type === "done") {
              if (event.sessionId) setSessionId(event.sessionId);
              if (event.completionSuggested) completionSuggestedEvent = true;
            }
          } catch {
            /* skip */
          }
        }
      }
      setMessages((m) => [
        ...m,
        {
          role: "j",
          text: plainText(content) || "…",
          saved: saved.length ? saved.map((s) => ({ label: s.label ?? "", section: s.section })) : undefined,
          toolErrorReasons: toolErrorReasons.length ? toolErrorReasons : undefined,
        },
      ]);
      if (completionSuggestedEvent) setCompletionSuggested(true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "j", text: e instanceof Error ? e.message : "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setStreamingSaved([]);
      setStreamingContent("");
    }
  }

  async function doneForNow() {
    if (jumpOffSummaryShown) {
      try {
        await fetch("/api/onboarding/partial", { method: "POST" });
      } catch {
        /* no-op */
      }
      router.push("/onboarding/connect");
      return;
    }
    setJumpOffLoading(true);
    setStreamingContent("");
    const history = messages
      .filter((m) => m.role === "j" || m.role === "u")
      .map((m) => ({ role: m.role === "u" ? "user" : "assistant", content: m.text }));
    try {
      const res = await fetch("/api/onboarding/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryOnly: true, sessionId, messages: history }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");
      let buffer = "";
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as { type: string; text?: string };
            if (event.type === "content" && event.text != null) {
              content = event.text;
              setStreamingContent(content);
            }
          } catch {
            /* skip */
          }
        }
      }
      setMessages((m) => [
        ...m,
        { role: "j", text: plainText(content) || "Here’s what I’ve got so far and what I’d still like to know when you’re back.", isJumpOffSummary: true },
      ]);
      setJumpOffSummaryShown(true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "j", text: e instanceof Error ? e.message : "Something went wrong. You can still continue to the next step.", isJumpOffSummary: false },
      ]);
      setJumpOffSummaryShown(true);
    } finally {
      setJumpOffLoading(false);
      setStreamingContent("");
    }
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-jacq-bg items-center justify-center">
        <p className="text-jacq-t2">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-jacq-bg">
      <div className="py-2.5 px-[18px] border-b border-jacq-bord flex items-center gap-2.5 flex-shrink-0">
        <JacqLogo size={26} />
        <span className="ml-auto text-[11px] text-jacq-t3">Getting to know you</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto pt-1"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
      >
        <div className="py-2 px-[18px] space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "j" ? (
                <div>
                  {msg.saved && msg.saved.length > 0 && (
                    <p className="text-[18px] text-jacq-t1 mb-1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
                      Got it, I&apos;ve noted that.
                    </p>
                  )}
                  {msg.saved?.map((s, j) => (
                    <SavedPanel key={j} label={s.label ?? ""} section={s.section} />
                  ))}
                  {msg.toolErrorReasons?.map((reason, j) => (
                    <p key={j} className="text-[13px] text-jacq-red mt-1 mb-1">
                      Couldn&apos;t save: {reason}
                    </p>
                  ))}
                  {(() => {
                    if (msg.isJumpOffSummary) {
                      const parsed = parseJumpOffSummary(msg.text);
                      if (parsed) return <JumpOffSummaryCard {...parsed} />;
                    }
                    return (
                      <p
                        className="text-[20px] text-jacq-t1 leading-[1.35] max-w-[90%] tracking-tight"
                        style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
                      >
                        {plainText(msg.text)}
                      </p>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="bg-jacq-surf2 rounded-[18px] py-2.5 px-4 max-w-[78%]">
                    <span className="text-[15px] text-jacq-t1 leading-relaxed">{msg.text}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(loading || jumpOffLoading) && (
            <>
              {!jumpOffLoading && streamingSaved.length > 0 && (
                <p className="text-[18px] text-jacq-t1 mb-1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
                  Got it, I&apos;ve noted that.
                </p>
              )}
              {!jumpOffLoading && streamingSaved.map((s, j) => (
                <SavedPanel key={j} label={s.label ?? ""} section={s.section} />
              ))}
              <p
                className="text-[20px] text-jacq-t1 leading-[1.35] max-w-[90%]"
                style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
              >
                {plainText(streamingContent) || "…"}
              </p>
            </>
          )}
        </div>
      </div>

      <div
        className="p-2.5 px-[18px] pb-7 border-t border-jacq-bord flex flex-col gap-2 flex-shrink-0"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.75rem)" }}
      >
        {completionSuggested ? (
          <Link
            href="/onboarding/connect"
            className="w-full h-[50px] rounded-[14px] bg-jacq-t1 border-none text-white text-[14px] font-semibold cursor-pointer flex items-center justify-center no-underline"
          >
            Connect my accounts →
          </Link>
        ) : jumpOffSummaryShown ? (
          <button
            type="button"
            onClick={doneForNow}
            className="w-full h-[50px] rounded-[14px] bg-jacq-t1 border-none text-white text-[14px] font-semibold cursor-pointer"
          >
            Continue to next step →
          </button>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type your answer…"
                className="flex-1 h-[44px] rounded-[10px] border border-jacq-bord bg-jacq-surf px-3.5 text-[14px] text-jacq-t1 placeholder:text-jacq-t3"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || jumpOffLoading}
                className="h-[44px] px-4 rounded-[10px] bg-jacq-t1 text-white text-[14px] font-semibold cursor-pointer disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <button
              type="button"
              onClick={doneForNow}
              disabled={jumpOffLoading}
              className="text-[13px] text-jacq-t3 underline self-start disabled:opacity-50"
            >
              Done for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
