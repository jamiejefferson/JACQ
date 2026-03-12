export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pt-3.5 px-[18px] pb-1.5 text-[13px] font-normal text-jacq-t1 tracking-tight"
      style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
    >
      {children}
    </div>
  );
}
