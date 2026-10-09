/** The recall knot: an S-shaped route with two terminals, not a stock icon. */
export function SourceMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <title>source:dev recall knot</title>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="var(--source-mark-bg, #b84913)"
      />
      <path
        d="M23 7H12a4.5 4.5 0 0 0 0 9h8a4.5 4.5 0 0 1 0 9H9"
        stroke="var(--source-mark-ink, #fffdfa)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <rect
        x="20.5"
        y="4.5"
        width="5"
        height="5"
        rx="1.5"
        fill="var(--source-mark-accent, #ffce9c)"
      />
      <rect
        x="6.5"
        y="22.5"
        width="5"
        height="5"
        rx="1.5"
        fill="var(--source-mark-accent, #ffce9c)"
      />
    </svg>
  );
}
