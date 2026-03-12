"use client";

/** Inline gold panel shown when extract_understanding tool saves to Understanding (addendum C). */
export function SavedPanel({ label, section }: { label: string; section?: string }) {
  const sectionLabel = section ? section.replace(/_/g, " ") : "";
  return (
    <div className="my-2 rounded-xl bg-jacq-gold/15 border border-jacq-gold/40 py-2 px-3 flex items-center gap-2">
      <span className="text-jacq-gold" aria-hidden>
        ✓
      </span>
      <span className="text-[13px] text-jacq-t1">
        Saved to understanding
        {label ? `: ${label}` : ""}
        {sectionLabel ? ` (${sectionLabel})` : ""}
      </span>
    </div>
  );
}
