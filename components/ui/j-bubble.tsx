"use client";

export function JBubble({ add = false, size = 20 }: { add?: boolean; size?: number }) {
  return (
    <div
      className="flex-shrink-0 cursor-pointer opacity-45 hover:opacity-100 flex items-center justify-center transition-opacity"
      style={{ width: size, height: size }}
      title={add ? "Add via Jacq" : "Chat about this"}
    >
      <svg viewBox="0 0 20 20" width={size} height={size} fill="none">
        <rect x="1" y="1" width="14" height="12" rx="3.5" fill="#B8935A" />
        <path d="M3 13 L2 17 L7 14" fill="#B8935A" />
        <text x="8" y="10.5" textAnchor="middle" fontFamily="Instrument Serif, Georgia, serif" fontSize="7.5" fontWeight="400" fill="white">
          J
        </text>
        {add && (
          <>
            <circle cx="15.5" cy="14.5" r="4" fill="#B8935A" />
            <path d="M13.5 14.5h4M15.5 12.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}
