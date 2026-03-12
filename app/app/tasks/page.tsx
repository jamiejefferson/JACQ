"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";
import { JBubble } from "@/components/ui/j-bubble";
import { Tag } from "@/components/ui/tag";
import { useAppStore } from "@/stores/app-store";

const COLUMN_IDS = ["todo", "jacq_acting", "waiting", "done"] as const;
const COLUMN_LABELS: Record<string, string> = {
  todo: "To Do",
  jacq_acting: "Jacq Acting",
  waiting: "Waiting",
  done: "Done",
};
const COLUMN_DOT: Record<string, string> = {
  todo: "var(--jacq-t3)",
  jacq_acting: "var(--jacq-gold)",
  waiting: "var(--jacq-amber)",
  done: "var(--jacq-green)",
};

type Task = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  working_note: string | null;
  source: string | null;
  completed_at: string | null;
  created_at: string;
};

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks?status=all");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.tasks ?? [];
}

function formatDate(s: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function TasksPage() {
  const openChat = useAppStore((s) => s.openChat);
  const [activeChip, setActiveChip] = useState<string>("todo");
  const [doneExpanded, setDoneExpanded] = useState(false);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const tasks = Array.isArray(data) ? data : [];

  const byStatus = COLUMN_IDS.reduce((acc, id) => {
    acc[id] = tasks.filter((t) => t.status === id);
    return acc;
  }, {} as Record<string, Task[]>);

  const doneThisWeek = (byStatus.done ?? []).filter((t) => {
    if (!t.completed_at) return false;
    const d = new Date(t.completed_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const scrollToColumn = (id: string) => {
    setActiveChip(id);
    columnRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-5 flex items-center justify-center">
        <p className="text-[13px] text-jacq-t2">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 overflow-y-auto pb-5 flex items-center justify-center">
        <p className="text-[13px] text-jacq-t2">Couldn&apos;t load tasks. Check your connection or sign in again.</p>
      </div>
    );
  }

  const hasAnyTasks = tasks.length > 0;

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto flex-shrink-0">
        {COLUMN_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToColumn(id)}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-[20px] flex-shrink-0 border cursor-pointer ${
              activeChip === id ? "bg-jacq-goldl border-jacq-gold text-jacq-gold" : "bg-jacq-surf border-jacq-bord text-jacq-t2"
            }`}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: COLUMN_DOT[id] ?? "var(--jacq-t3)" }}
            />
            <span className="text-[11.5px] font-semibold whitespace-nowrap">{COLUMN_LABELS[id]}</span>
          </button>
        ))}
      </div>

      {!hasAnyTasks && (
        <div className="mx-4 mt-4 p-4 bg-jacq-surf rounded-[14px] border border-jacq-bord text-center">
          <p className="text-[18px] text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
            No tasks yet.
          </p>
          <p className="text-[13px] text-jacq-t2 mb-4">
            I&apos;ll extract action items from your emails automatically, or you can add one now.
          </p>
          <button
            type="button"
            onClick={() => openChat({ screen: "tasks", prefill: "I want to add a new task." })}
            className="py-2 px-4 rounded-xl bg-jacq-gold text-white text-[13px] font-semibold cursor-pointer"
          >
            Add task via Jacq
          </button>
        </div>
      )}

      {COLUMN_IDS.filter((id) => id !== "done").map((id) => {
        const columnTasks = byStatus[id] ?? [];
        return (
          <div key={id} ref={(el) => { columnRefs.current[id] = el; }}>
            {(columnTasks.length > 0 || hasAnyTasks) && (
              <>
                <SectionLabel>{COLUMN_LABELS[id]} · {columnTasks.length}</SectionLabel>
                {columnTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/app/tasks/${task.id}`}
                    className="block mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord p-3 no-underline text-inherit"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className="flex-1 text-[13px] font-semibold text-jacq-t1">{task.title}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openChat({ screen: "tasks", itemId: task.id, itemLabel: task.title });
                        }}
                        className="flex-shrink-0 p-0 border-0 bg-transparent cursor-pointer"
                      >
                        <JBubble size={20} />
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {(task.tags ?? []).map((t) => (
                        <Tag key={t} color="default">{t}</Tag>
                      ))}
                    </div>
                    {task.working_note && (
                      <div className="text-[12px] text-jacq-t2 leading-relaxed mb-1">{task.working_note}</div>
                    )}
                    <div className="text-[11px] text-jacq-t3 font-dm-mono">{task.source ?? "Added manually"}</div>
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    openChat({
                      screen: "tasks",
                      section: COLUMN_LABELS[id],
                      prefill: `I want to add a task to ${COLUMN_LABELS[id]}.`,
                    })
                  }
                  className="mx-4 mb-2 border border-dashed border-jacq-bord rounded-[14px] py-2.5 px-3.5 flex items-center gap-2 w-[calc(100%-32px)] bg-transparent cursor-pointer text-left"
                >
                  <JBubble add size={22} />
                  <span className="text-[12px] text-jacq-t3">Add task via Jacq</span>
                </button>
              </>
            )}
          </div>
        );
      })}

      <div ref={(el) => { columnRefs.current.done = el; }}>
        <div className="flex items-center justify-between pr-4">
          <SectionLabel>Done this week · {doneThisWeek.length}</SectionLabel>
          <button
            type="button"
            onClick={() => setDoneExpanded(!doneExpanded)}
            className="p-1"
            aria-label={doneExpanded ? "Collapse" : "Expand"}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              className={`fill-jacq-t3 transition-transform ${doneExpanded ? "rotate-180" : ""}`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>
        </div>
        {doneExpanded &&
          doneThisWeek.map((task) => (
            <Link
              key={task.id}
              href={`/app/tasks/${task.id}`}
              className="block mx-4 mb-1.5 bg-jacq-surf rounded-[10px] border border-jacq-bord py-2 px-3.5 flex gap-2.5 items-center no-underline text-inherit"
            >
              <svg viewBox="0 0 24 24" width={13} height={13} className="fill-jacq-green flex-shrink-0">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="flex-1 text-[12px] text-jacq-t2 line-through">{task.title}</span>
              <span className="text-[10px] text-jacq-t3 font-dm-mono">{task.completed_at ? formatDate(task.completed_at) : ""}</span>
            </Link>
          ))}
      </div>

      <div className="h-5" />
    </div>
  );
}
