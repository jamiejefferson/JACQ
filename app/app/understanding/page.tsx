"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";
import { DataRow } from "@/components/ui/data-row";
import { JBubble } from "@/components/ui/j-bubble";
import { useAppStore } from "@/stores/app-store";

const SECTION_ORDER = ["about_me", "communication", "calendar_time", "working_style"] as const;
const SECTION_LABELS: Record<string, string> = {
  about_me: "About me",
  communication: "Communication",
  calendar_time: "Calendar & time",
  working_style: "Working style",
};

type UnderstandingEntry = {
  id: string;
  section: string;
  label: string;
  value: string;
  source: string;
};

type UnderstandingResponse = {
  entries: UnderstandingEntry[];
  bySection: Record<string, UnderstandingEntry[]>;
};

async function fetchWithTimeout(url: string, ms = 5_000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function fetchUnderstanding(): Promise<UnderstandingResponse> {
  const res = await fetchWithTimeout("/api/understanding");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const COMM_PROFILE_LABELS: Record<string, string> = {
  writing_tone: "Writing tone",
  writing_length: "Message length",
  proactivity_level: "Proactivity level",
  short_reply_means: "Short reply means",
  feedback_preference: "Feedback preference",
  sensitivity_areas: "Sensitivity areas",
  writing_formality: "Formality",
  preferred_update_channel: "Preferred channel",
  language: "Language",
};

async function fetchCommunicationProfile(): Promise<Record<string, unknown>> {
  const res = await fetchWithTimeout("/api/communication-profile");
  if (!res.ok) return {};
  return res.json();
}

async function confirmEntry(id: string): Promise<UnderstandingEntry> {
  const res = await fetch(`/api/understanding/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "confirmed" }),
  });
  if (!res.ok) throw new Error("Failed to confirm");
  return res.json();
}

export default function UnderstandingPage() {
  const queryClient = useQueryClient();
  const openChat = useAppStore((s) => s.openChat);
  const [search, setSearch] = useState("");
  const [filterInferred, setFilterInferred] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["understanding", filterInferred ? "inferred" : "all"],
    queryFn: () =>
      filterInferred
        ? fetchWithTimeout("/api/understanding?source=inferred").then((res) => {
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
          })
        : fetchUnderstanding(),
    retry: false,
  });

  const { data: commProfile = {} } = useQuery({
    queryKey: ["communication-profile"],
    queryFn: fetchCommunicationProfile,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["understanding"] }),
  });

  const safeData = isError ? null : data;
  const bySection = useMemo(() => safeData?.bySection ?? {}, [safeData?.bySection]);
  const entries = safeData?.entries ?? (safeData?.bySection ? Object.values(safeData.bySection).flat() : []);
  const totalCount = entries.length;
  const inferredCount = entries.filter((e: UnderstandingEntry) => e.source === "inferred").length;

  const filteredBySection = useMemo(() => {
    const low = search.trim().toLowerCase();
    if (low.length < 2) {
      return Object.fromEntries(SECTION_ORDER.map((k) => [k, bySection[k] ?? []]));
    }
    const out: Record<string, UnderstandingEntry[]> = {};
    for (const key of SECTION_ORDER) {
      const list = (bySection[key] ?? []).filter(
        (e: UnderstandingEntry) =>
          e.label.toLowerCase().includes(low) || e.value.toLowerCase().includes(low)
      );
      if (list.length) out[key] = list;
    }
    return out;
  }, [bySection, search]);

  const hasEnoughEntries = totalCount >= 5;
  const showEmptyState = !isLoading && totalCount === 0;

  const { data: pendingReview } = useQuery({
    queryKey: ["learning-reviews", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/learning-reviews/pending");
      if (!res.ok) return null;
      const j = await res.json();
      return j?.id ? j : null;
    },
  });

  const isLoadingInitial = isLoading && !data && !isError;

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      {isLoadingInitial && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-jacq-surf border border-jacq-bord text-[12px] text-jacq-t2">
          Loading your understanding… If this doesn’t load in a few seconds, sign in again or check your connection.
        </div>
      )}
      {isError && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-jacq-amberl border border-jacq-amber/20 text-[12px] text-jacq-t2">
          Couldn&apos;t load understanding. Sections below may be empty until the connection is restored.
        </div>
      )}
      {pendingReview && (
        <div className="mx-4 mt-1 p-3 bg-jacq-goldl rounded-[14px] border border-jacq-goldb flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-jacq-gold mb-1 font-dm-sans tracking-wide">
              Weekly learning · ready to review
            </div>
            <div className="text-[12px] text-jacq-t2 leading-relaxed font-dm-sans">
              This week I picked up a few things about how you work. Want to review them?
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openChat({
                screen: "understanding",
                section: "weekly-review",
                itemId: pendingReview.id,
                prefill: "Let's review what you learned this week.",
              })
            }
            className="py-1.5 px-3 rounded-lg bg-jacq-gold cursor-pointer flex-shrink-0"
          >
            <span className="text-[11px] font-semibold text-white font-dm-sans">Review</span>
          </button>
        </div>
      )}

      {hasEnoughEntries && (
        <div className="py-2.5 px-[18px] pt-2.5">
          <span className="text-[12px] text-jacq-t2 font-dm-sans">
            Jacq understands <strong className="text-jacq-t1">{totalCount} things</strong> about you.{" "}
            {inferredCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterInferred(!filterInferred)}
                className="text-jacq-amber underline"
              >
                {inferredCount} were inferred from how you work.
              </button>
            )}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => openChat({ screen: "understanding", section: "new", prefill: "" })}
        className="mx-4 mb-2 p-2.5 bg-jacq-surf rounded-xl border border-jacq-bord flex items-center gap-2.5 cursor-pointer w-[calc(100%-32px)] text-left"
      >
        <JBubble add size={22} />
        <span className="text-[13px] text-jacq-t1 font-dm-sans">Teach Jacq something new</span>
        <svg viewBox="0 0 24 24" width={14} height={14} className="ml-auto fill-jacq-t3">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>

      {hasEnoughEntries && (
        <div className="px-4 pb-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search understanding…"
            className="w-full h-9 bg-jacq-surf border border-jacq-bord rounded-[10px] px-3 text-[13px] text-jacq-t1 placeholder:text-jacq-t3"
          />
        </div>
      )}

      {showEmptyState && (
        <>
          {SECTION_ORDER.map((key) => (
            <div key={key}>
              <SectionLabel>{SECTION_LABELS[key] ?? key}</SectionLabel>
              <div className="mx-4 mb-1.5 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden py-4 px-3.5">
                <p className="text-[13px] text-jacq-t2">
                  Nothing here yet — I&apos;ll fill this in as I get to know you.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <JBubble add size={20} />
                  <span className="text-[12px] text-jacq-t3">Add via Jacq</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {!showEmptyState &&
        SECTION_ORDER.map((key) => {
          const rows = filteredBySection[key] ?? [];
          const isComm = key === "communication";
          const profileRows =
            isComm && commProfile && typeof commProfile === "object"
              ? (Object.entries(commProfile as Record<string, unknown>)
                  .filter(([k]) => COMM_PROFILE_LABELS[k] != null && (commProfile as Record<string, unknown>)[k] != null && (commProfile as Record<string, unknown>)[k] !== "")
                  .map(([k, v]) => ({
                    label: COMM_PROFILE_LABELS[k],
                    value: Array.isArray(v) ? (v as string[]).join(", ") : String(v),
                  })) as { label: string; value: string }[])
              : [];
          const totalRows = rows.length + profileRows.length;
          if (totalRows === 0 && search.trim().length >= 2) return null;
          return (
            <div key={key}>
              <SectionLabel>{SECTION_LABELS[key] ?? key}</SectionLabel>
              <div className="mx-4 mb-1.5 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
                {totalRows === 0 && search.trim().length < 2 ? (
                  <div className="py-4 px-3.5 text-[13px] text-jacq-t2">
                    Nothing here yet — I&apos;ll fill this in as I get to know you.
                  </div>
                ) : (
                  <>
                    {rows.map((entry: UnderstandingEntry, i: number) => (
                      <DataRow
                        key={entry.id}
                        label={entry.label}
                        value={entry.value}
                        inferred={entry.source === "inferred"}
                        showDivider={i > 0 || profileRows.length > 0}
                        onConfirm={
                          entry.source === "inferred"
                            ? () => confirmMutation.mutate(entry.id)
                            : undefined
                        }
                        onJBubble={() =>
                          openChat({
                            screen: "understanding",
                            section: entry.section,
                            itemId: entry.id,
                            itemLabel: entry.label,
                          })
                        }
                      />
                    ))}
                    {profileRows.map((pr, i) => (
                      <DataRow
                        key={`profile-${pr.label}`}
                        label={pr.label}
                        value={pr.value}
                        showDivider={rows.length > 0 || i > 0}
                        onJBubble={() =>
                          openChat({
                            screen: "understanding",
                            section: "communication",
                            itemLabel: pr.label,
                            prefill: `I want to update my ${pr.label} preference.`,
                          })
                        }
                      />
                    ))}
                  </>
                )}
                <div className="py-2 px-3.5 border-t border-jacq-bord2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openChat({
                        screen: "understanding",
                        section: SECTION_LABELS[key] ?? key,
                        prefill: `I want to add something to my ${SECTION_LABELS[key] ?? key} preferences.`,
                      })
                    }
                    className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
                  >
                    <JBubble add size={22} />
                    <span className="text-[12px] text-jacq-t3">Add to {SECTION_LABELS[key] ?? key} via Jacq</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

      {search.trim().length >= 2 && Object.keys(filteredBySection).length === 0 && (
        <div className="px-4 py-2 text-[13px] text-jacq-t2">No entries matching &quot;{search}&quot;.</div>
      )}

      <div className="h-5" />
    </div>
  );
}
