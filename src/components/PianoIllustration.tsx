/** シンプルな装飾用グランドピアノのイラスト(SVG)。実際の写真が用意でき次第、差し替え可能。 */
export function PianoIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label="グランドピアノのイラスト"
      className={className}
    >
      <defs>
        <linearGradient id="lidGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E6F73" />
          <stop offset="100%" stopColor="#1F2A44" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="235" rx="150" ry="10" fill="#1F2A44" opacity="0.08" />
      <path
        d="M60 90 C 60 60, 120 40, 210 45 C 300 50, 340 90, 340 130 L 340 190 L 250 200 L 240 150 L 90 150 L 80 200 L 60 190 Z"
        fill="url(#lidGradient)"
      />
      <rect x="90" y="150" width="150" height="18" rx="3" fill="#F4F1EA" />
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={92 + i * 6.2} y="150" width="5" height="18" fill={i % 3 === 1 ? "#1F2A44" : "#FFFFFF"} stroke="#E5E1D8" strokeWidth="0.5" />
      ))}
      <rect x="70" y="196" width="20" height="34" rx="2" fill="#C9A24B" />
      <rect x="240" y="196" width="20" height="34" rx="2" fill="#C9A24B" />
      <rect x="185" y="200" width="14" height="30" rx="2" fill="#C9A24B" />
    </svg>
  );
}
