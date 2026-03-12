"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SectionLabel } from "@/components/ui/section-label";
import { DataRow } from "@/components/ui/data-row";
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
  jacq_context: Record<string, string> | null;
  communication_preferences: Record<string, string> | null;
  alert: string | null;
};

type Signals = { response_rate: string; meeting_frequency: string; last_contact: string };

type OpenItem = { id: string; description: string; item_type: string | null };

async function fetchContact(id: string): Promise<Contact> {
  const res = await fetch(`/api/contacts/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

async function fetchSignals(id: string): Promise<Signals> {
  const res = await fetch(`/api/contacts/${id}/signals`);
  if (!res.ok) return { response_rate: "—", meeting_frequency: "—", last_contact: "—" };
  return res.json();
}

async function fetchOpenItems(id: string): Promise<OpenItem[]> {
  const res = await fetch(`/api/contacts/${id}/open-items`);
  if (!res.ok) return [];
  return res.json();
}

function contextToRows(ctx: Record<string, string> | null): Array<{ label: string; value: string }> {
  if (!ctx || typeof ctx !== "object") return [];
  return Object.entries(ctx).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) }));
}

export default function RelationshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const openChat = useAppStore((s) => s.openChat);

  const { data: contact, isLoading } = useQuery({ queryKey: ["contact", id], queryFn: () => fetchContact(id) });
  const { data: signals } = useQuery({ queryKey: ["contacts", id, "signals"], queryFn: () => fetchSignals(id) });
  const { data: openItems = [] } = useQuery({ queryKey: ["contacts", id, "open-items"], queryFn: () => fetchOpenItems(id) });

  if (isLoading || !contact) {
    return (
      <div className="flex-1 overflow-y-auto pb-5 flex items-center justify-center">
        <p className="text-[13px] text-jacq-t2">Loading…</p>
      </div>
    );
  }

  const contextRows = contextToRows(contact.jacq_context);
  const prefRows = contextToRows(contact.communication_preferences);

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <div className="mx-4 mt-1 bg-jacq-surf rounded-[14px] border border-jacq-bord p-3.5">
        <div className="flex gap-3 mb-2.5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[15px] font-bold"
            style={{ background: contact.colour ?? "#7a7268" }}
          >
            {contact.initials ?? "?"}
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-normal text-jacq-t1" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              {contact.name}
            </div>
            <div className="text-[12px] text-jacq-t2 mt-0.5">{contact.role ?? contact.organisation ?? "—"}</div>
          </div>
          <button
            type="button"
            onClick={() => openChat({ screen: "relationships", itemId: contact.id, itemLabel: contact.name })}
            className="p-0 border-0 bg-transparent cursor-pointer self-start"
          >
            <JBubble size={20} />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {contact.is_vip && <Tag color="gold">VIP</Tag>}
          {contact.alert && <Tag color="green">{contact.alert}</Tag>}
          {openItems.length > 0 && <Tag color="amber">{openItems.length} open items</Tag>}
        </div>
      </div>

      {signals && (
        <div className="mx-4 mt-1.5 bg-jacq-surf rounded-xl border border-jacq-bord py-2 flex">
          <div className="flex-1 text-center border-r border-jacq-bord2 py-0 px-2">
            <div className="text-[10px] text-jacq-t3 font-dm-mono mb-1">Response rate</div>
            <div className="text-[12px] font-semibold text-jacq-t1 font-dm-sans">{signals.response_rate}</div>
          </div>
          <div className="flex-1 text-center border-r border-jacq-bord2 py-0 px-2">
            <div className="text-[10px] text-jacq-t3 font-dm-mono mb-1">Meets</div>
            <div className="text-[12px] font-semibold text-jacq-t1 font-dm-sans">{signals.meeting_frequency}</div>
          </div>
          <div className="flex-1 text-center py-0 px-2">
            <div className="text-[10px] text-jacq-t3 font-dm-mono mb-1">Last contact</div>
            <div className="text-[12px] font-semibold text-jacq-t1 font-dm-sans">{signals.last_contact}</div>
          </div>
        </div>
      )}

      <SectionLabel>Jacq&apos;s context</SectionLabel>
      <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        {contextRows.length === 0 ? (
          <div className="py-3 px-3.5 text-[13px] text-jacq-t2">No context yet.</div>
        ) : (
          contextRows.map((row, i) => (
            <DataRow
              key={row.label}
              label={row.label}
              value={row.value}
              showDivider={i > 0}
              onJBubble={() => openChat({ screen: "relationships", itemId: id, itemLabel: contact.name, section: "context" })}
            />
          ))
        )}
        <div className="py-2 px-3.5 border-t border-jacq-bord2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat({ screen: "relationships", itemId: id, section: "context" })}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <JBubble add size={22} />
            <span className="text-[12px] text-jacq-t3">Add context via Jacq</span>
          </button>
        </div>
      </div>

      <SectionLabel>Communication preferences</SectionLabel>
      <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        {prefRows.length === 0 ? (
          <div className="py-3 px-3.5 text-[13px] text-jacq-t2">No preferences set.</div>
        ) : (
          prefRows.map((row, i) => (
            <DataRow
              key={row.label}
              label={row.label}
              value={row.value}
              showDivider={i > 0}
              onJBubble={() => openChat({ screen: "relationships", itemId: id, section: "preferences" })}
            />
          ))
        )}
        <div className="py-2 px-3.5 border-t border-jacq-bord2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat({ screen: "relationships", itemId: id, section: "preferences" })}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <JBubble add size={22} />
            <span className="text-[12px] text-jacq-t3">Add preference via Jacq</span>
          </button>
        </div>
      </div>

      <SectionLabel>Open items</SectionLabel>
      <div className="mx-4 mb-2 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        {openItems.length === 0 ? (
          <div className="py-3 px-3.5 text-[13px] text-jacq-t2">No open items.</div>
        ) : (
          openItems.map((item, i) => (
            <div key={item.id}>
              <div className="py-2.5 px-3.5 flex items-center gap-2">
                <span className="flex-1 text-[13px] text-jacq-t1">{item.description}</span>
                {item.item_type && <Tag color="default">{item.item_type}</Tag>}
                <button type="button" onClick={() => openChat({ screen: "relationships", itemId: id, itemLabel: item.description })} className="p-0 border-0 bg-transparent cursor-pointer">
                  <JBubble size={18} />
                </button>
              </div>
              {i < openItems.length - 1 && <div className="h-px bg-jacq-bord2 mx-3.5" />}
            </div>
          ))
        )}
        <div className="py-2 px-3.5 border-t border-jacq-bord2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChat({ screen: "relationships", itemId: id, section: "open-items" })}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <JBubble add size={22} />
            <span className="text-[12px] text-jacq-t3">Add open item via Jacq</span>
          </button>
        </div>
      </div>
      <div className="h-5" />
    </div>
  );
}
