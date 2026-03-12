"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

/**
 * Syncs Zustand darkMode to document for data-theme (design tokens).
 * Renders nothing; must be mounted inside body.
 */
export function ThemeSync() {
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [darkMode]);

  return null;
}
