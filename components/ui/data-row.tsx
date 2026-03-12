"use client";

import { JBubble } from "@/components/ui/j-bubble";

export interface DataRowProps {
  label: string;
  value: string;
  inferred?: boolean;
  onConfirm?: () => void;
  onJBubble?: () => void;
  showDivider?: boolean;
}

export function DataRow({
  label,
  value,
  inferred = false,
  onConfirm,
  onJBubble,
  showDivider = true,
}: DataRowProps) {
  return (
    <>
      {showDivider && <div className="h-px bg-jacq-bord2 mx-3.5" role="separator" />}
      <div
        className={`py-2.5 px-3.5 flex items-center justify-between gap-2 ${
          inferred ? "border-l-2 border-jacq-amber pl-3" : ""
        }`}
      >
        <span className="text-[11px] font-dm-mono text-jacq-t3 w-[112px] flex-shrink-0">
          {label}
        </span>
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          {inferred && onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="text-[12px] font-semibold text-jacq-amber cursor-pointer flex-shrink-0"
            >
              Confirm?
            </button>
          )}
          <span
            className={`text-[13px] truncate ${inferred ? "text-jacq-t2" : "text-jacq-t1"}`}
          >
            {value}
          </span>
          {onJBubble && (
            <button
              type="button"
              onClick={onJBubble}
              className="flex-shrink-0 p-0 border-0 bg-transparent cursor-pointer"
              aria-label="Chat about this"
            >
              <JBubble size={20} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
