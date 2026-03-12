"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";
import { JBubble } from "@/components/ui/j-bubble";
import { Tag } from "@/components/ui/tag";
import { useAppStore } from "@/stores/app-store";

type Commitment = {
  id: string;
  description: string;
  due_at: string | null;
  status: string;
  source_label: string | null;
  completed_at: string | null;
};

type ActionLog = {
  id: string;
  description: string;
  action_type: string;
  created_at: string;
  is_undoable: boolean;
};

type Pattern = {
  id: string;
  observation: string;
  category: string;
  created_at: string;
};

async function fetchActiveCommitments(): Promise<Commitment[]> {
  const res = await fetch("/api/commitments?status=active");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchCompletedCommitments(): Promise<Commitment[]> {
  const res = await fetch("/api/commitments?status=completed&period=week");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchActivityLog(period: string): Promise<ActionLog[]> {
  const res = await fetch(`/api/activity-log?period=${period}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchPatterns(): Promise<Pattern[]> {
  const res = await fetch("/api/patterns?status=pending");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function undoAction(id: string) {
  const res = await fetch(`/api/activity-log/${id}/undo`, { method: "POST" });
  if (!res.ok) throw new Error("Undo failed");
}

async function patchPreferences(patch: Record<string, unknown>) {
  const res = await fetch("/api/users/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed");
}

async function pauseAutonomy() {
  const res = await fetch("/api/users/pause-autonomy", { method: "POST" });
  if (!res.ok) throw new Error("Failed");
}

async function resumeAutonomy() {
  const res = await fetch("/api/users/resume-autonomy", { method: "POST" });
  if (!res.ok) throw new Error("Failed");
}

function formatDue(s: string | null): string {
  if (!s) return "No due date";
  const d = new Date(s);
  const now = new Date();
  const hours = (d.getTime() - now.getTime()) / (60 * 60 * 1000);
  if (hours < 0) return "Overdue";
  if (hours < 24) return "Today";
  if (hours < 48) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(s: string): string {
  return new Date(s).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const AUTONOMY_LEVELS = ["cautious", "balanced", "autonomous"] as const;

export default function ActivityPage() {
  const queryClient = useQueryClient();
  const openChat = useAppStore((s) => s.openChat);
  const [yesterdayExpanded, setYesterdayExpanded] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [autonomyLevel, setAutonomyLevel] = useState<string>("balanced");
  const [paused, setPaused] = useState(false);

  const { data: activeCommitments = [] } = useQuery({
    queryKey: ["commitments", "active"],
    queryFn: fetchActiveCommitments,
  });
  const { data: completedCommitments = [] } = useQuery({
    queryKey: ["commitments", "completed"],
    queryFn: fetchCompletedCommitments,
  });
  const { data: actionsToday = [] } = useQuery({
    queryKey: ["activity-log", "today"],
    queryFn: () => fetchActivityLog("today"),
  });
  const { data: actionsYesterday = [] } = useQuery({
    queryKey: ["activity-log", "yesterday"],
    queryFn: () => fetchActivityLog("yesterday"),
  });
  const { data: patterns = [] } = useQuery({
    queryKey: ["patterns"],
    queryFn: fetchPatterns,
  });

  const pauseMutation = useMutation({
    mutationFn: pauseAutonomy,
    onSuccess: () => {
      setPaused(true);
      setShowPauseModal(false);
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
  const resumeMutation = useMutation({
    mutationFn: resumeAutonomy,
    onSuccess: () => {
      setPaused(false);
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
  const prefMutation = useMutation({
    mutationFn: patchPreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
  });
  const undoMutation = useMutation({
    mutationFn: undoAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activity-log"] }),
  });

  const total = activeCommitments.length + completedCommitments.length;
  const completed = completedCommitments.length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const rateColor = total === 0 ? "text-jacq-t3" : rate >= 100 ? "text-jacq-green" : rate >= 80 ? "text-jacq-amber" : "text-jacq-red";

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <SectionLabel>Commitments</SectionLabel>
      <div className="mx-4 mb-2 p-2.5 bg-jacq-surf rounded-xl border border-jacq-bord flex items-center justify-between">
        <span className="text-[12px] text-jacq-t2 font-dm-sans">This week&apos;s completion rate</span>
        <span className={`text-[15px] font-bold font-dm-mono ${rateColor}`}>{total === 0 ? "—" : `${rate}%`}</span>
      </div>

      {activeCommitments.length === 0 && (
        <p className="mx-4 mb-2 text-[13px] text-jacq-t2">No active commitments. When I commit to doing something, it&apos;ll appear here.</p>
      )}
      {activeCommitments.map((c) => (
        <div key={c.id} className="mx-4 mb-1.5 bg-jacq-surf rounded-xl border border-jacq-bord p-2.5">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[13px] font-semibold text-jacq-t1 flex-1 pr-2">{c.description}</span>
            <button type="button" onClick={() => openChat({ screen: "activity", section: "commitments", itemId: c.id, itemLabel: c.description })} className="p-0 border-0 bg-transparent cursor-pointer">
              <JBubble size={20} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-jacq-t3 font-dm-mono">{c.source_label ?? "—"}</span>
            <span className="text-[11px] font-dm-mono text-jacq-t3">Due: {formatDue(c.due_at)}</span>
          </div>
        </div>
      ))}

      {completedCommitments.length > 0 && (
        <div className="mx-4 mb-2 bg-jacq-surf rounded-xl border border-jacq-bord overflow-hidden">
          <div className="py-2 px-3.5 flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={13} height={13} className="fill-jacq-green" />
            <span className="flex-1 text-[12px] text-jacq-t2 font-dm-sans">Completed this week · {completedCommitments.length}</span>
          </div>
          {completedCommitments.map((c) => (
            <div key={c.id} className="py-1.5 px-3.5 flex items-center gap-2 border-t border-jacq-bord2">
              <svg viewBox="0 0 24 24" width={12} height={12} className="fill-jacq-green flex-shrink-0" />
              <span className="text-[12px] text-jacq-t2 line-through flex-1">{c.description}</span>
              <span className="text-[10px] text-jacq-t3 font-dm-mono">{c.completed_at ? formatTime(c.completed_at) : ""}</span>
            </div>
          ))}
        </div>
      )}

      <SectionLabel>Actions taken today</SectionLabel>
      {actionsToday.length === 0 && (
        <p className="mx-4 mb-2 text-[13px] text-jacq-t2">Nothing yet today — I&apos;ll log actions here as I work.</p>
      )}
      <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        {actionsToday.map((a) => (
          <div key={a.id} className="py-2 px-3.5 flex gap-2.5 items-center">
            <svg viewBox="0 0 24 24" width={13} height={13} className="fill-jacq-green flex-shrink-0" />
            <span className="flex-1 text-[12px] text-jacq-t1">{a.description}</span>
            <Tag color="default">{a.action_type}</Tag>
            <span className="text-[10px] text-jacq-t3 font-dm-mono flex-shrink-0">{formatTime(a.created_at)}</span>
            {a.is_undoable && (
              <button
                type="button"
                onClick={() => undoMutation.mutate(a.id)}
                className="text-[11px] text-jacq-amber font-semibold cursor-pointer"
              >
                Undo
              </button>
            )}
            <button type="button" onClick={() => openChat({ screen: "activity", section: "actions", itemId: a.id, itemLabel: a.description })} className="p-0 border-0 bg-transparent cursor-pointer">
              <JBubble size={18} />
            </button>
          </div>
        ))}
      </div>
      {actionsYesterday.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setYesterdayExpanded(!yesterdayExpanded)}
            className="mx-4 mb-1 flex items-center gap-2 text-[12px] text-jacq-t2"
          >
            Yesterday
            <svg viewBox="0 0 24 24" width={14} height={14} className={`fill-jacq-t3 ${yesterdayExpanded ? "rotate-180" : ""}`}>
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>
          {yesterdayExpanded && (
            <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
              {actionsYesterday.map((a) => (
                <div key={a.id} className="py-2 px-3.5 flex gap-2.5 items-center">
                  <svg viewBox="0 0 24 24" width={13} height={13} className="fill-jacq-green flex-shrink-0" />
                  <span className="flex-1 text-[12px] text-jacq-t1">{a.description}</span>
                  <Tag color="default">{a.action_type}</Tag>
                  <span className="text-[10px] text-jacq-t3 font-dm-mono">{formatTime(a.created_at)}</span>
                  <JBubble size={18} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <SectionLabel>Patterns observed</SectionLabel>
      {patterns.length === 0 && (
        <p className="mx-4 mb-2 text-[13px] text-jacq-t2">I&apos;ll surface patterns here as I get to know how you work. Usually takes a week or two.</p>
      )}
      {patterns.map((p) => (
        <div
          key={p.id}
          className="mx-4 mb-2 bg-jacq-surf rounded-xl border border-jacq-bord border-l-[3px] border-l-jacq-gold p-2.5"
        >
          <div className="mb-2">
            <span className="text-[12px] text-jacq-t1 leading-relaxed font-dm-sans">{p.observation}</span>
          </div>
          <div className="flex gap-2 items-center">
            <Tag color="gold">{p.category}</Tag>
            <span className="text-[11px] text-jacq-t3 font-dm-mono ml-auto">Observed {formatTime(p.created_at)}</span>
            <button type="button" onClick={() => openChat({ screen: "activity", section: "patterns", itemId: p.id, itemLabel: p.observation })} className="p-0 border-0 bg-transparent cursor-pointer">
              <JBubble size={18} />
            </button>
          </div>
        </div>
      ))}

      <SectionLabel>Autonomy level</SectionLabel>
      <div className="mx-4 bg-jacq-surf rounded-[14px] border border-jacq-bord p-3 mb-2">
        <div className="flex gap-1.5 mb-2.5">
          {AUTONOMY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                setAutonomyLevel(level);
                prefMutation.mutate({ autonomy_level: level });
              }}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center cursor-pointer capitalize ${
                autonomyLevel === level ? "bg-jacq-goldl border border-jacq-goldb text-jacq-gold" : "bg-jacq-surf2 text-jacq-t3"
              }`}
            >
              <span className="text-[11px] font-semibold">{level}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-[12px] text-jacq-t2 leading-relaxed">
            Jacq drafts before acting. Change here or message Jacq on Telegram.
          </div>
          <button type="button" onClick={() => openChat({ screen: "activity", section: "autonomy" })} className="p-0 border-0 bg-transparent cursor-pointer">
            <JBubble size={20} />
          </button>
        </div>
      </div>

      {paused ? (
        <div className="mx-4 mt-1">
          <button
            type="button"
            onClick={() => resumeMutation.mutate()}
            className="w-full py-2.5 px-3 rounded-xl bg-jacq-greenl border border-jacq-green/30 text-jacq-green text-[12px] font-semibold cursor-pointer"
          >
            Resume autonomous actions
          </button>
        </div>
      ) : (
        <div className="mx-4 mt-1">
          <button
            type="button"
            onClick={() => setShowPauseModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-jacq-redl border border-jacq-red/25 text-jacq-red text-[12px] font-semibold cursor-pointer"
          >
            Pause all autonomous actions
          </button>
        </div>
      )}

      {showPauseModal && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setShowPauseModal(false)} />
          <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[81] bg-jacq-surf rounded-[14px] border border-jacq-bord p-4 shadow-lg max-w-[343px] mx-auto">
            <h3 className="text-[20px] text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              Pause Jacq?
            </h3>
            <p className="text-[14px] text-jacq-t2 mb-4">
              Jacq will stop all autonomous actions immediately. I&apos;ll still monitor and alert you, but I won&apos;t act without asking first. You can resume any time.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pauseMutation.mutate()}
                className="flex-1 py-2.5 rounded-xl bg-jacq-t1 text-white text-[14px] font-semibold cursor-pointer"
              >
                Pause now
              </button>
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-jacq-surf2 text-jacq-t1 text-[14px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <div className="h-5" />
    </div>
  );
}
