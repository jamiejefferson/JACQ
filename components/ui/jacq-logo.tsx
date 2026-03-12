export function JacqLogo({
  size = 22,
  color = "var(--jacq-gold)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: size,
        color,
      }}
    >
      Jacq
    </span>
  );
}
