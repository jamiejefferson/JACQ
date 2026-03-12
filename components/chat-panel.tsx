"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore, type ChatContext } from "@/stores/app-store";
import { SavedPanel } from "@/components/saved-panel";

function contextLabel(ctx: ChatContext | null): string {
  if (!ctx) return "";
  const parts = [ctx.screen];
  if (ctx.section) parts.push(ctx.section);
  if (ctx.itemLabel) parts.push(ctx.itemLabel);
  return parts.join(" · ");
}

function ChatPanelComponent() {
  const isOpen = useAppStore((s) => s.isChatPanelOpen);
  const context = useAppStore((s) => s.activeChatContext);
  const history = useAppStore((s) => s.chatHistory);
  const sessionId = useAppStore((s) => s.chatSessionId);
  const closeChat = useAppStore((s) => s.closeChat);
  const appendChatMessage = useAppStore((s) => s.appendChatMessage);
  const setChatSessionId = useAppStore((s) => s.setChatSessionId);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingSaved, setStreamingSaved] = useState<{ label?: string; section?: string }[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (context?.prefill) setInput(context.prefill);
    else setInput("");
  }, [context?.prefill]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history, streamingSaved, streamingContent]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    appendChatMessage({ role: "user", content: text });
    setInput("");
    setLoading(true);
    setError(null);
    setStreamingSaved([]);
    setStreamingContent("");

    const messages = [...history, { role: "user" as const, content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, context, sessionId }),
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as { type: string; tool?: string; label?: string; section?: string; text?: string; sessionId?: string; ok?: boolean; reason?: string };
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
              if (event.sessionId) setChatSessionId(event.sessionId);
            }
          } catch {
            // skip malformed line
          }
        }
      }
      appendChatMessage({
        role: "assistant",
        content: content || "…",
        saved: saved.length ? saved.map((s) => ({ label: s.label ?? "", section: s.section })) : undefined,
        toolErrorReasons: toolErrorReasons.length ? toolErrorReasons : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Tap to retry.");
    } finally {
      setLoading(false);
      setStreamingSaved([]);
      setStreamingContent("");
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/30"
        onClick={closeChat}
        onKeyDown={(e) => e.key === "Escape" && closeChat()}
        role="button"
        tabIndex={0}
        aria-label="Close chat"
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-[71] bg-jacq-bg rounded-t-[24px] shadow-lg flex flex-col max-h-[72vh] max-w-[375px] mx-auto"
        style={{ height: "72vh" }}
      >
        <div className="flex-shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-jacq-bord" />
        </div>
        <div className="flex-shrink-0 px-4 pb-2 flex items-center justify-between">
          <span className="text-[11px] text-jacq-t3 font-dm-mono">{contextLabel(context)}</span>
          <button
            type="button"
            onClick={closeChat}
            className="w-8 h-8 rounded-lg bg-jacq-surf2 flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="var(--jacq-t2)">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {history.length === 0 && !loading && (
            <p className="text-[14px] text-jacq-t2">Say something and I&apos;ll help.</p>
          )}
          {history.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex justify-end my-2">
                <div className="bg-jacq-surf2 rounded-[18px] py-2.5 px-4 max-w-[85%]">
                  <span className="text-[15px] text-jacq-t1">{msg.content}</span>
                </div>
              </div>
            ) : (
              <div key={i} className="my-2">
                {msg.saved && msg.saved.length > 0 && (
                  <p className="text-[18px] text-jacq-t1 mb-1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
                    Got it, I&apos;ve noted that.
                  </p>
                )}
                {msg.saved?.map((s, j) => (
                  <SavedPanel key={j} label={s.label ?? ""} section={s.section} />
                ))}
                {msg.role === "assistant" && msg.toolErrorReasons?.map((reason, j) => (
                  <p key={j} className="text-[13px] text-jacq-red mt-1 mb-1">Couldn&apos;t save: {reason}</p>
                ))}
                <p
                  className="text-[20px] text-jacq-t1 leading-snug"
                  style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
                >
                  {msg.content}
                </p>
              </div>
            )
          )}
          {loading && (
            <>
              {streamingSaved.length > 0 && (
                <p className="text-[18px] text-jacq-t1 mb-1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
                  Got it, I&apos;ve noted that.
                </p>
              )}
              {streamingSaved.map((s, j) => (
                <SavedPanel key={j} label={s.label ?? ""} section={s.section} />
              ))}
              <p
                className="text-[20px] text-jacq-t1 leading-snug mt-2"
                style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
              >
                {streamingContent || "…"}
              </p>
            </>
          )}
          {error && (
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-2 text-[13px] text-jacq-t2 underline"
            >
              {error}
            </button>
          )}
        </div>

        <div className="flex-shrink-0 p-3 border-t border-jacq-bord flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message…"
            className="flex-1 h-11 rounded-xl border border-jacq-bord bg-jacq-surf px-3.5 text-[14px] text-jacq-t1 placeholder:text-jacq-t3"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="h-11 w-11 rounded-xl bg-jacq-gold flex items-center justify-center cursor-pointer disabled:opacity-50"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export { ChatPanelComponent as ChatPanel };
export default ChatPanelComponent;
