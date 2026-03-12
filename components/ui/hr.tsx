export function Hr({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-jacq-bord2 mx-3.5 ${className}`.trim()} role="separator" />;
}
