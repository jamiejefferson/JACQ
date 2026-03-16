"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/insights/unread-count");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export function InsightBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["insights", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });

  if (count === 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-jacq-gold text-white text-[9px] font-bold flex items-center justify-center px-1 font-dm-mono">
      {count > 9 ? "9+" : count}
    </span>
  );
}
