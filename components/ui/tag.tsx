const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: "rgba(122,114,104,0.16)", text: "#7A7268" },
  gold: { bg: "rgba(184,147,90,0.16)", text: "#B8935A" },
  green: { bg: "rgba(58,148,104,0.10)", text: "#3A9468" },
  amber: { bg: "rgba(192,123,40,0.10)", text: "#C07B28" },
  blue: { bg: "rgba(48,96,184,0.08)", text: "#3060B8" },
};

export function Tag({ children, color = "default" }: { children: React.ReactNode; color?: keyof typeof TAG_COLORS }) {
  const c = TAG_COLORS[color] ?? TAG_COLORS.default;
  return (
    <span
      className="inline-flex py-0.5 px-[7px] rounded-full text-[10.5px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
}
