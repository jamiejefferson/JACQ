"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { useAppStore } from "@/stores/app-store";

const IDEAS = [
  {
    title: "Add more about yourself",
    description: "Continue onboarding or teach Jacq something new so I can help you better.",
    href: "/app",
    cta: "Understanding",
  },
  {
    title: "Add to your information",
    description: "Fill in tasks, relationships and preferences so I have the full picture.",
    links: [
      { label: "Tasks", href: "/app/tasks" },
      { label: "Relationships", href: "/app/relationships" },
      { label: "Settings", href: "/app/settings" },
    ],
  },
  {
    title: "Next actions from your data",
    description: "When you connect email, calendar and notes, I'll suggest next steps from new messages, meetings and to-dos.",
    placeholder: true,
  },
];

export default function HomePage() {
  const openChat = useAppStore((s) => s.openChat);

  return (
    <div className="flex-1 overflow-y-auto pb-5">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[15px] text-jacq-t2 font-dm-sans leading-relaxed">
          Here are a few things you might like to do next.
        </p>
      </div>

      {IDEAS.map((block, i) => (
        <div key={i} className="px-4 mb-5">
          <SectionLabel>{block.title}</SectionLabel>
          <div className="mt-1.5 p-4 bg-jacq-surf rounded-xl border border-jacq-bord">
            <p className="text-[13px] text-jacq-t2 mb-3">{block.description}</p>
            {block.href && (
              <Link
                href={block.href}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-jacq-gold no-underline"
              >
                {block.cta}
                <svg viewBox="0 0 24 24" width={14} height={14} className="fill-current">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </Link>
            )}
            {block.links && (
              <div className="flex flex-wrap gap-2">
                {block.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="px-3 py-1.5 rounded-lg bg-jacq-surf2 border border-jacq-bord text-[13px] text-jacq-t1 no-underline hover:bg-jacq-surf3"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
            {block.placeholder && (
              <p className="text-[12px] text-jacq-t3 font-dm-sans">
                Connect Gmail, Calendar and more in Settings to get started.
              </p>
            )}
          </div>
        </div>
      ))}

      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => openChat({ screen: "home", prefill: "What should I do first?" })}
          className="w-full py-3 px-4 rounded-xl bg-jacq-surf border border-jacq-bord text-[13px] text-jacq-t1 font-dm-sans flex items-center justify-center gap-2"
        >
          <span>Ask Jacq what to do next</span>
        </button>
      </div>
    </div>
  );
}
