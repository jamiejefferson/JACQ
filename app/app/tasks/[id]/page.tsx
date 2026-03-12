"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";
import { JBubble } from "@/components/ui/j-bubble";
import { Tag } from "@/components/ui/tag";
import { useAppStore } from "@/stores/app-store";

type Task = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  working_note: string | null;
  source: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type Subtask = { id: string; text: string; done: boolean; owner: string };

type Contact = { id: string; name: string; role: string | null; initials: string | null; colour: string | null };

type TaskPerson = { id: string; contact_id: string; role: string | null; contacts: Contact | null };

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  jacq_acting: "Jacq Acting",
  waiting: "Waiting",
  done: "Done",
};

async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  const res = await fetch(`/api/tasks/${taskId}/subtasks`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchPeople(taskId: string): Promise<TaskPerson[]> {
  const res = await fetch(`/api/tasks/${taskId}/people`);
  if (!res.ok) return [];
  return res.json();
}

async function patchSubtask(taskId: string, subId: string, done: boolean) {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

function formatDate(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const openChat = useAppStore((s) => s.openChat);

  const { data: task, isLoading } = useQuery({ queryKey: ["task", id], queryFn: () => fetchTask(id) });
  const { data: subtasks = [] } = useQuery({ queryKey: ["tasks", id, "subtasks"], queryFn: () => fetchSubtasks(id) });
  const { data: people = [] } = useQuery({ queryKey: ["tasks", id, "people"], queryFn: () => fetchPeople(id) });

  const subtaskMutation = useMutation({
    mutationFn: ({ subId, done }: { subId: string; done: boolean }) => patchSubtask(id, subId, done),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id, "subtasks"] });
    },
  });

  if (isLoading || !task) {
    return (
      <div className="flex-1 overflow-y-auto pb-5 flex items-center justify-center">
        <p className="text-[13px] text-jacq-t2">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <div className="mx-4 mt-1 p-2.5 bg-jacq-surf rounded-[14px] border border-jacq-bord flex gap-2 flex-wrap">
        <span className="text-[11px] text-jacq-t3 font-dm-mono">{STATUS_LABELS[task.status] ?? task.status}</span>
        <span className="text-jacq-t3">·</span>
        <span className="text-[11px] text-jacq-t3 font-dm-mono">{task.source ?? "Manual"}</span>
        <span className="text-jacq-t3">·</span>
        <span className="text-[11px] text-jacq-t3 font-dm-mono">{formatDate(task.created_at)}</span>
        {task.due_at && (
          <>
            <span className="text-jacq-t3">·</span>
            <span className="text-[11px] text-jacq-t3 font-dm-mono">Due {formatDate(task.due_at)}</span>
          </>
        )}
      </div>

      {task.working_note && (
        <>
          <SectionLabel>Jacq&apos;s working notes</SectionLabel>
          <div className="mx-4 mb-2 p-3 bg-jacq-goldl rounded-[10px] border border-jacq-goldb">
            <div className="text-[11px] font-semibold text-jacq-gold mb-1">Jacq is working on this</div>
            <div className="text-[12px] text-jacq-t2 leading-relaxed">{task.working_note}</div>
            <button
              type="button"
              onClick={() => openChat({ screen: "tasks", itemId: task.id, itemLabel: task.title })}
              className="mt-2 p-0 border-0 bg-transparent cursor-pointer"
            >
              <JBubble size={18} />
            </button>
          </div>
        </>
      )}

      <SectionLabel>Sub-tasks</SectionLabel>
      <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        {subtasks.map((st, i, arr) => (
          <div key={st.id}>
            <div className="py-2.5 px-3.5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (st.owner === "JJ" || st.owner === "user") {
                    subtaskMutation.mutate({ subId: st.id, done: !st.done });
                  } else {
                    openChat({ screen: "task-detail", section: "subtasks", itemId: id });
                  }
                }}
                className={`w-4 h-4 rounded-[5px] border flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  st.done ? "bg-jacq-green border-jacq-green" : "border-jacq-bord"
                }`}
              >
                {st.done && (
                  <svg viewBox="0 0 24 24" width={10} height={10} fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-[13px] ${st.done ? "text-jacq-t3 line-through" : "text-jacq-t1"}`}>
                {st.text}
              </span>
              <Tag color={st.owner === "Jacq" || st.owner === "jacq" ? "gold" : "blue"}>
                {st.owner === "Jacq" || st.owner === "jacq" ? "Jacq" : "JJ"}
              </Tag>
              <button
                type="button"
                onClick={() => openChat({ screen: "task-detail", section: "subtasks", itemId: id, itemLabel: st.text })}
                className="p-0 border-0 bg-transparent cursor-pointer"
              >
                <JBubble size={20} />
              </button>
            </div>
            {i < arr.length - 1 && <div className="h-px bg-jacq-bord2 mx-3.5" />}
          </div>
        ))}
        <div className="py-2 px-3.5 border-t border-jacq-bord2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat({ screen: "task-detail", section: "subtasks", itemId: id })}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <JBubble add size={22} />
            <span className="text-[12px] text-jacq-t3">Add sub-task via Jacq</span>
          </button>
        </div>
      </div>

      <SectionLabel>People involved</SectionLabel>
      <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        {people.map((p, i) => (
          <div key={p.id}>
            <Link
              href={`/app/relationships/${p.contact_id}`}
              className="py-2.5 px-3.5 flex gap-2.5 items-center no-underline text-inherit"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-semibold"
                style={{ background: p.contacts?.colour ?? "#7a7268" }}
              >
                {p.contacts?.initials ?? "?"}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-jacq-t1">{p.contacts?.name ?? "Unknown"}</div>
                <div className="text-[11px] text-jacq-t2 mt-0.5">{p.role ?? ""}</div>
              </div>
              <JBubble size={20} />
            </Link>
            {i < people.length - 1 && <div className="h-px bg-jacq-bord2 mx-3.5" />}
          </div>
        ))}
        <div className="py-2 px-3.5 border-t border-jacq-bord2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat({ screen: "task-detail", section: "people", itemId: id })}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <JBubble add size={22} />
            <span className="text-[12px] text-jacq-t3">Add person via Jacq</span>
          </button>
        </div>
      </div>
      <div className="h-5" />
    </div>
  );
}
