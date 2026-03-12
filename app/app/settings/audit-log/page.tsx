"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";

type AuditEntry = {
  id: string;
  path: string;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
  changed_by: string;
  created_at: string;
};

async function fetchAuditLog(): Promise<{ items: AuditEntry[] }> {
  const res = await fetch("/api/audit-log?limit=50");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function revertAuditEntry(id: string): Promise<void> {
  const res = await fetch(`/api/audit-log/${id}/revert`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to revert");
}

export default function AuditLogPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-log"],
    queryFn: fetchAuditLog,
  });
  const revertMutation = useMutation({
    mutationFn: revertAuditEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });

  const entries = (data?.items ?? []) as AuditEntry[];

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <SectionLabel>Settings audit log</SectionLabel>
      <p className="mx-4 mb-2 text-[13px] text-jacq-t2">
        Changes Jacq made to your preferences. You can revert any entry.
      </p>
      {isLoading && (
        <div className="mx-4 p-3 text-[13px] text-jacq-t2">Loading…</div>
      )}
      {isError && (
        <div className="mx-4 p-3 rounded-xl bg-jacq-amberl border border-jacq-amber/20 text-[13px] text-jacq-t2">
          Couldn&apos;t load audit log.
        </div>
      )}
      {!isLoading && !isError && (
        <div className="mx-4 mb-1.5 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
          {entries.length === 0 ? (
            <div className="py-4 px-3.5 text-[13px] text-jacq-t2">No entries yet.</div>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.id}>
                {i > 0 && <div className="h-px bg-jacq-bord2 mx-3.5" />}
                <div className="py-2.5 px-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-dm-mono text-jacq-t3">{entry.path}</span>
                    <span className="text-[11px] text-jacq-t3">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[12px] text-jacq-t2">
                    {entry.changed_by === "jacq" ? "Jacq" : "You"}: {entry.reason ?? "—"}
                  </div>
                  <div className="text-[12px] text-jacq-t1">
                    {JSON.stringify(entry.old_value)} → {JSON.stringify(entry.new_value)}
                  </div>
                  <button
                    type="button"
                    onClick={() => revertMutation.mutate(entry.id)}
                    disabled={revertMutation.isPending}
                    className="text-[12px] font-semibold text-jacq-gold cursor-pointer self-start disabled:opacity-50"
                  >
                    Revert
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <div className="h-5" />
    </div>
  );
}
