"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const setToast = useAppStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[90] max-w-[343px] mx-auto py-2.5 px-3 rounded-xl bg-jacq-redl border border-jacq-red/30 text-jacq-red text-[12px] font-dm-sans flex items-center justify-between gap-2 shadow-lg">
      <span>{toast}</span>
      <button type="button" onClick={() => setToast(null)} className="flex-shrink-0 text-jacq-red font-semibold" aria-label="Dismiss">
        Dismiss
      </button>
    </div>
  );
}
