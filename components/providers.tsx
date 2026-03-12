"use client";

import { ThemeSync } from "@/components/theme-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSync />
      {children}
    </>
  );
}
