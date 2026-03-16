"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";

type InsightResult = {
  id: string;
  trigger_label: string;
  issues: Array<{ summary: string; detail?: string; severity?: string }>;
  opportunities: Array<{ summary: string; detail?: string }>;
  actions: Array<{ summary: string; owner?: string; status?: string }>;
  raw_text: string | null;
  tools_used: string[];
  status: string;
  created_at: string;
};

type InsightTrigger = {
  id: string;
  label: string;
  prompt: string;
  schedule_type: string;
  cron_expression: string | null;
  run_at: string | null;
  enabled: boolean;
  is_system_default: boolean;
  created_by: string;
  last_run_at: string | null;
};

async function fetchInsights(status: string): Promise<InsightResult[]> {
  const res = await fetch(`/api/insights?status=${status}&limit=30`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.insights ?? [];
}

async function fetchTriggers(): Promise<InsightTrigger[]> {
  const res = await fetch("/api/insights/triggers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.triggers ?? [];
}

async function markInsight(id: string, status: string) {
  await fetch(`/api/insights/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

async function toggleTrigger(id: string, enabled: boolean) {
  await fetch(`/api/insights/triggers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}

function formatTime(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / (60 * 60 * 1000);
  if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function describeCron(cron: string | null): string {
  if (!cron) return "";
  const parts = cron.split(/\s+/);
  if (parts.length < 5) return cron;
  const min = parts[0].padStart(2, "0");
  const hr = parts[1].padStart(2, "0");
  const dow = parts[4];
  const dayMap: Record<string, string> = { "*": "Daily", "1-5": "Weekdays", "0,6": "Weekends" };
  return `${dayMap[dow] ?? dow} at ${hr}:${min}`;
}

function InsightCard({ insight, onMarkRead }: { insight: InsightResult; onMarkRead: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasStructured = insight.issues.length > 0 || insight.opportunities.length > 0 || insight.actions.length > 0;

  return (
    <div className={`mx-4 mb-2 bg-jacq-surf rounded-xl border ${insight.status === "unread" ? "border-jacq-goldb" : "border-jacq-bord"} overflow-hidden`}>
      <button
        type="button"
        onClick={() => {
          setExpanded(!expanded);
          if (insight.status === "unread") onMarkRead();
        }}
        className="w-full p-3 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
      >
        {insight.status === "unread" && (
          <div className="w-2 h-2 rounded-full bg-jacq-gold flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-jacq-t1">{insight.trigger_label}</div>
          <div className="text-[11px] text-jacq-t3 font-dm-mono mt-0.5">{formatTime(insight.created_at)}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {insight.issues.length > 0 && (
            <span className="text-[10px] font-dm-mono text-jacq-red">{insight.issues.length} issue{insight.issues.length !== 1 ? "s" : ""}</span>
          )}
          {insight.actions.length > 0 && (
            <span className="text-[10px] font-dm-mono text-jacq-t2">{insight.actions.length} action{insight.actions.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <svg viewBox="0 0 24 24" width={14} height={14} className={`fill-jacq-t3 transition-transform ${expanded ? "rotate-180" : ""}`}>
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-jacq-bord2">
          {hasStructured ? (
            <>
              {insight.issues.length > 0 && (
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-jacq-red uppercase tracking-wider mb-1">Issues</div>
                  {insight.issues.map((issue, i) => (
                    <div key={i} className="mb-1.5">
                      <div className="text-[12px] text-jacq-t1 font-semibold">
                        {issue.severity === "high" && <span className="text-jacq-red mr-1">!!</span>}
                        {issue.severity === "medium" && <span className="text-jacq-amber mr-1">!</span>}
                        {issue.summary}
                      </div>
                      {issue.detail && <div className="text-[11px] text-jacq-t2 mt-0.5">{issue.detail}</div>}
                    </div>
                  ))}
                </div>
              )}

              {insight.opportunities.length > 0 && (
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-jacq-green uppercase tracking-wider mb-1">Opportunities</div>
                  {insight.opportunities.map((opp, i) => (
                    <div key={i} className="mb-1.5">
                      <div className="text-[12px] text-jacq-t1">{opp.summary}</div>
                      {opp.detail && <div className="text-[11px] text-jacq-t2 mt-0.5">{opp.detail}</div>}
                    </div>
                  ))}
                </div>
              )}

              {insight.actions.length > 0 && (
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-jacq-gold uppercase tracking-wider mb-1">Actions</div>
                  {insight.actions.map((action, i) => (
                    <div key={i} className="mb-1.5 flex items-start gap-1.5">
                      <span className="text-[10px] font-dm-mono text-jacq-t3 mt-0.5 flex-shrink-0">
                        {action.owner === "jacq" ? "[Jacq]" : "[You]"}
                      </span>
                      <span className="text-[12px] text-jacq-t1">{action.summary}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : insight.raw_text ? (
            <div className="mt-2.5 text-[12px] text-jacq-t1 whitespace-pre-wrap leading-relaxed">
              {insight.raw_text.slice(0, 2000)}
            </div>
          ) : (
            <div className="mt-2.5 text-[12px] text-jacq-t2">No findings from this investigation.</div>
          )}

          {insight.tools_used.length > 0 && (
            <div className="mt-2 text-[10px] text-jacq-t3 font-dm-mono">
              Tools used: {insight.tools_used.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"insights" | "triggers">("insights");
  const [insightFilter, setInsightFilter] = useState<"unread" | "all">("unread");

  const { data: insights = [] } = useQuery({
    queryKey: ["insights", insightFilter],
    queryFn: () => fetchInsights(insightFilter),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["insight-triggers"],
    queryFn: fetchTriggers,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markInsight(id, "read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  const toggleTriggerMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleTrigger(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insight-triggers"] });
    },
  });

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      {/* Tab switcher */}
      <div className="mx-4 mt-2 mb-3 flex gap-1 bg-jacq-surf2 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setTab("insights")}
          className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${
            tab === "insights" ? "bg-jacq-surf text-jacq-t1 shadow-sm" : "text-jacq-t3 bg-transparent"
          }`}
        >
          Insights
        </button>
        <button
          type="button"
          onClick={() => setTab("triggers")}
          className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${
            tab === "triggers" ? "bg-jacq-surf text-jacq-t1 shadow-sm" : "text-jacq-t3 bg-transparent"
          }`}
        >
          Triggers
        </button>
      </div>

      {tab === "insights" && (
        <>
          <div className="mx-4 mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setInsightFilter("unread")}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${
                insightFilter === "unread" ? "bg-jacq-goldl text-jacq-gold border border-jacq-goldb" : "bg-jacq-surf2 text-jacq-t3"
              }`}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => setInsightFilter("all")}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${
                insightFilter === "all" ? "bg-jacq-goldl text-jacq-gold border border-jacq-goldb" : "bg-jacq-surf2 text-jacq-t3"
              }`}
            >
              All
            </button>
          </div>

          {insights.length === 0 && (
            <p className="mx-4 text-[13px] text-jacq-t2">
              {insightFilter === "unread"
                ? "No unread insights. Jacq will investigate and brief you at your scheduled times."
                : "No insights yet. They\u2019ll appear here as Jacq runs proactive investigations."}
            </p>
          )}

          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onMarkRead={() => markReadMutation.mutate(insight.id)}
            />
          ))}
        </>
      )}

      {tab === "triggers" && (
        <>
          <SectionLabel>Active triggers</SectionLabel>
          {triggers.length === 0 && (
            <p className="mx-4 text-[13px] text-jacq-t2">No triggers configured. Default triggers will be created on your next check-in.</p>
          )}
          {triggers.map((trigger) => (
            <div key={trigger.id} className="mx-4 mb-2 bg-jacq-surf rounded-xl border border-jacq-bord p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-jacq-t1">{trigger.label}</div>
                  <div className="text-[11px] text-jacq-t3 font-dm-mono mt-0.5">
                    {trigger.schedule_type === "recurring"
                      ? describeCron(trigger.cron_expression)
                      : trigger.run_at
                        ? `Once at ${new Date(trigger.run_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
                        : "One-time"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTriggerMutation.mutate({ id: trigger.id, enabled: !trigger.enabled })}
                  className="w-10 h-6 rounded-xl bg-jacq-surf2 border border-jacq-bord relative cursor-pointer flex-shrink-0"
                  aria-label={trigger.enabled ? "Disable trigger" : "Enable trigger"}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                      trigger.enabled ? "bg-jacq-gold left-[18px]" : "bg-jacq-t3 left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] text-jacq-t2 mt-1 line-clamp-2">{trigger.prompt}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-jacq-t3 font-dm-mono">
                  {trigger.created_by === "system" ? "Default" : trigger.created_by === "jacq" ? "Created by Jacq" : "Custom"}
                </span>
                {trigger.last_run_at && (
                  <span className="text-[10px] text-jacq-t3 font-dm-mono">
                    Last run: {formatTime(trigger.last_run_at)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="h-5" />
    </div>
  );
}
