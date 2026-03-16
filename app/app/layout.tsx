"use client";

import Link from "next/link";
import { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import ChatPanel from "@/components/chat-panel";
import { Toast } from "@/components/toast";
import { InsightBadge } from "@/components/insight-badge";

const BURGER_LINKS = [
  { label: "Home", sub: "What to do next", href: "/app" },
  { label: "Understanding", sub: "Jacq's picture of you", href: "/app/understanding" },
  { label: "Tasks", sub: "Jacq's work surface", href: "/app/tasks" },
  { label: "Insights", sub: "Proactive briefings and alerts", href: "/app/insights" },
  { label: "Activity", sub: "Commitments, actions and patterns", href: "/app/activity" },
  { label: "Relationships", sub: "People Jacq knows about", href: "/app/relationships" },
  { label: "Settings", sub: "Integrations, LLM, preferences", href: "/app/settings" },
];

function TopNav({
  title,
  sub,
  backHref,
  action,
  onAction,
  burgerOpen,
  onBurgerOpenChange,
}: {
  title: string;
  sub?: string;
  backHref?: string;
  action?: string;
  onAction?: () => void;
  burgerOpen: boolean;
  onBurgerOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="pt-4 pb-2.5 px-[18px] flex items-center gap-2.5 flex-shrink-0 relative z-[50] bg-jacq-bg">
      {backHref && (
        <Link href={backHref} className="w-8 h-8 rounded-[10px] bg-jacq-surf2 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" width={15} height={15} fill="var(--jacq-t2)"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[17px] font-normal text-jacq-t1 tracking-tight leading-tight" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>{title}</div>
        {sub && <div className="text-[11px] text-jacq-t2 mt-0.5">{sub}</div>}
      </div>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-semibold text-jacq-gold cursor-pointer flex-shrink-0"
        >
          {action}
        </button>
      )}
      <button
        type="button"
        onClick={() => onBurgerOpenChange(!burgerOpen)}
        className="w-[34px] h-[34px] rounded-[10px] bg-jacq-surf2 flex items-center justify-center cursor-pointer flex-shrink-0 relative z-10 touch-manipulation"
        aria-label={burgerOpen ? "Close menu" : "Open menu"}
        aria-expanded={burgerOpen}
      >
        <InsightBadge />
        {burgerOpen ? (
          <svg viewBox="0 0 24 24" width={16} height={16} fill="var(--jacq-t2)">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 18 14" width={16} height={13} fill="var(--jacq-t2)">
            <rect y={0} width={18} height={2} rx={1} />
            <rect y={6} width={12} height={2} rx={1} />
            <rect y={12} width={18} height={2} rx={1} />
          </svg>
        )}
      </button>
    </div>
  );
}

function BurgerOverlay({ onClose }: { onClose: () => void }) {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  async function handleToggleDark() {
    toggleDarkMode();
    try {
      await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dark_mode: !darkMode }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center bg-black/40 min-[768px]:inset-auto min-[768px]:top-5 min-[768px]:left-1/2 min-[768px]:-translate-x-1/2 min-[768px]:w-[375px] min-[768px]:h-[calc(100vh-40px)] min-[768px]:rounded-[2rem] min-[768px]:overflow-hidden"
      style={{ padding: "env(safe-area-inset-top) 0 env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[375px] mx-auto flex-1 flex flex-col bg-jacq-bg rounded-[44px] overflow-hidden shadow-xl min-h-0 min-[768px]:rounded-none min-[768px]:max-w-none" onClick={(e) => e.stopPropagation()}>
      <div className="py-1 px-[18px] pb-4 flex items-center border-b border-jacq-bord">
        <span className="text-[28px] italic text-jacq-gold" style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}>Jacq</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-[18px]">
        {BURGER_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="w-full flex items-center gap-3.5 py-3 px-0 bg-transparent border-none cursor-pointer border-b border-jacq-bord2 text-left font-dm-sans no-underline"
          >
            <div className="w-[38px] h-[38px] rounded-[11px] bg-jacq-surf2 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" width={18} height={18} fill="var(--jacq-t2)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            </div>
            <div>
              <div className="text-[15px] font-normal text-jacq-t1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>{item.label}</div>
              <div className="text-[12px] text-jacq-t2 mt-0.5">{item.sub}</div>
            </div>
          </Link>
        ))}
        <div className="mt-4 py-3 px-3.5 bg-jacq-surf rounded-[14px] border border-jacq-bord flex items-center justify-between">
          <div>
            <div className="text-[14px] font-normal text-jacq-t1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>{darkMode ? "Dark mode" : "Light mode"}</div>
            <div className="text-[11px] text-jacq-t2 mt-0.5">Currently {darkMode ? "dark" : "light"}</div>
          </div>
          <button
            type="button"
            onClick={handleToggleDark}
            className="w-10 h-6 rounded-xl bg-jacq-surf2 border border-jacq-bord relative cursor-pointer"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-jacq-t3 transition-transform ${darkMode ? "left-[18px]" : "left-0.5"}`}
            />
          </button>
        </div>
        <a
          href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "jacq_bot"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-2.5 h-[50px] rounded-[14px] bg-jacq-t1 border-none flex items-center justify-center gap-2.5 cursor-pointer font-dm-sans no-underline"
        >
          <span className="text-[14px] font-normal text-white" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>Message Jacq</span>
        </a>
        <div className="mt-5 text-center text-[10px] text-jacq-t3 font-dm-mono tracking-widest pb-6">JACQ ALPHA 0.4.1</div>
      </div>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const openChat = useAppStore((s) => s.openChat);
  const pathname = usePathname();
  const openChatForTasks = useCallback(() => {
    openChat({ screen: "tasks", prefill: "I want to add a new task." });
  }, [openChat]);

  const titleMap: Record<string, { title: string; sub?: string; back?: string; action?: string; onAction?: () => void }> = {
    "/app": { title: "Home", sub: "What to do next" },
    "/app/understanding": { title: "Understanding", sub: "Jacq's picture of you" },
    "/app/tasks": {
      title: "Tasks",
      sub: "Jacq's work surface",
      action: "+ Add",
      onAction: openChatForTasks,
    },
    "/app/insights": { title: "Insights", sub: "Proactive briefings and alerts" },
    "/app/activity": { title: "Activity", sub: "Commitments, actions and patterns" },
    "/app/settings": { title: "Settings" },
    "/app/settings/audit-log": { title: "Audit log", sub: "Changes to your preferences", back: "/app/settings" },
    "/app/relationships": { title: "Relationships", sub: "People Jacq knows about" },
  };
  if (pathname.startsWith("/app/tasks/") && pathname !== "/app/tasks") {
    titleMap[pathname] = { title: "Team offsite", sub: "To Do · Events · Q2", back: "/app/tasks" };
  }
  if (pathname.startsWith("/app/relationships/") && pathname !== "/app/relationships") {
    titleMap[pathname] = { title: "Sarah Mitchell", sub: "Direct report · EQTR", back: "/app/relationships" };
  }
  const meta = titleMap[pathname] || titleMap["/app"];

  return (
    <div className="min-h-0 flex flex-1 flex-col bg-jacq-bg max-w-[375px] w-full mx-auto relative">
      <TopNav
        title={meta.title}
        sub={meta.sub}
        backHref={meta.back}
        action={meta.action}
        onAction={meta.onAction}
        burgerOpen={burgerOpen}
        onBurgerOpenChange={setBurgerOpen}
      />
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {mounted && burgerOpen && createPortal(
          <div className="fixed inset-0 z-[60]" aria-hidden="false">
            <BurgerOverlay onClose={() => setBurgerOpen(false)} />
          </div>,
          document.body
        )}
        <div data-app-scroll className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 min-h-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}>
          {children}
        </div>
      </div>
      <ChatPanel />
      <Toast />
    </div>
  );
}
