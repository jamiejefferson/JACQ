"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";
import { JBubble } from "@/components/ui/j-bubble";
import { Tag } from "@/components/ui/tag";
import { useAppStore } from "@/stores/app-store";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  organisation: string | null;
  is_vip: boolean;
  initials: string | null;
  colour: string | null;
  last_contact_at: string | null;
  alert: string | null;
};

type ContactsResponse = { contacts: Contact[]; vip: Contact[]; others: Contact[] };

async function fetchContacts(): Promise<ContactsResponse> {
  const res = await fetch("/api/contacts");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatLast(s: string | null): string {
  if (!s) return "Never";
  const d = new Date(s);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function RelationshipsPage() {
  const openChat = useAppStore((s) => s.openChat);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

  const vip = useMemo(() => data?.vip ?? [], [data?.vip]);
  const others = useMemo(() => data?.others ?? [], [data?.others]);

  const filteredVip = useMemo(() => {
    if (search.trim().length < 2) return vip;
    const q = search.trim().toLowerCase();
    return vip.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.role ?? "").toLowerCase().includes(q) ||
        (c.organisation ?? "").toLowerCase().includes(q)
    );
  }, [vip, search]);
  const filteredOthers = useMemo(() => {
    if (search.trim().length < 2) return others;
    const q = search.trim().toLowerCase();
    return others.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.role ?? "").toLowerCase().includes(q) ||
        (c.organisation ?? "").toLowerCase().includes(q)
    );
  }, [others, search]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-5 flex items-center justify-center">
        <p className="text-[13px] text-jacq-t2">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 overflow-y-auto pb-5 flex items-center justify-center px-4">
        <p className="text-[13px] text-jacq-t2 text-center">Couldn&apos;t load contacts. Check your connection or sign in again.</p>
      </div>
    );
  }

  const hasContacts = vip.length > 0 || others.length > 0;

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <div className="px-4 py-2.5 flex-shrink-0">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search relationships…"
          className="w-full h-9 bg-jacq-surf border border-jacq-bord rounded-[10px] px-3 text-[13px] text-jacq-t1 placeholder:text-jacq-t3"
        />
      </div>

      {!hasContacts && (
        <div className="mx-4 mt-4 p-4 text-center">
          <p className="text-[13px] text-jacq-t2 mb-4">
            No contacts yet. I&apos;ll build this from your email and calendar as I connect them.
          </p>
          <button
            type="button"
            onClick={() => openChat({ screen: "relationships", section: "new" })}
            className="py-2 px-4 rounded-xl bg-jacq-gold text-white text-[13px] font-semibold cursor-pointer"
          >
            Add contact via Jacq
          </button>
        </div>
      )}

      {filteredVip.length > 0 && (
        <>
          <SectionLabel>VIPs · {filteredVip.length}</SectionLabel>
          {filteredVip.map((c) => (
            <Link
              key={c.id}
              href={`/app/relationships/${c.id}`}
              className="block mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord p-3 no-underline text-inherit"
            >
              <div className="flex gap-2.5 mb-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold"
                  style={{ background: c.colour ?? "#7a7268" }}
                >
                  {c.initials ?? "?"}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-jacq-t1">{c.name}</div>
                  <div className="text-[12px] text-jacq-t2 mt-0.5">{c.role ?? c.organisation ?? "—"}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openChat({ screen: "relationships", itemId: c.id, itemLabel: c.name });
                  }}
                  className="p-0 border-0 bg-transparent cursor-pointer"
                >
                  <JBubble size={20} />
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Tag color="default">Last: {formatLast(c.last_contact_at)}</Tag>
                {c.alert && <Tag color="green">{c.alert}</Tag>}
              </div>
            </Link>
          ))}
        </>
      )}

      {filteredOthers.length > 0 && (
        <>
          <SectionLabel>Others · {filteredOthers.length}</SectionLabel>
          <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
            {filteredOthers.map((c, i) => (
              <div key={c.id}>
                <Link
                  href={`/app/relationships/${c.id}`}
                  className="py-2.5 px-3.5 flex gap-2.5 items-center no-underline text-inherit"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-semibold"
                    style={{ background: c.colour ?? "#7a7268" }}
                  >
                    {c.initials ?? "?"}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-jacq-t1">{c.name}</div>
                    <div className="text-[11px] text-jacq-t2 mt-0.5">{c.role ?? c.organisation ?? "—"}</div>
                  </div>
                  <JBubble size={18} />
                </Link>
                {i < filteredOthers.length - 1 && <div className="h-px bg-jacq-bord2 mx-3.5" />}
              </div>
            ))}
          </div>
        </>
      )}

      {hasContacts && (
        <div className="mx-4 mb-2 py-2.5 px-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat({ screen: "relationships", section: "new" })}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <JBubble add size={22} />
            <span className="text-[12px] text-jacq-t3">Add relationship via Jacq</span>
          </button>
        </div>
      )}

      {search.trim().length >= 2 && filteredVip.length === 0 && filteredOthers.length === 0 && (
        <p className="mx-4 py-2 text-[13px] text-jacq-t2">No contacts matching &quot;{search}&quot;.</p>
      )}

      <div className="h-5" />
    </div>
  );
}
