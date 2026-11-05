/**
 * セクションの境目に敷く、鍵盤の並びを模した帯(静止画)。
 * 1オクターブ(白鍵7・黒鍵5)のパターンを横に繰り返す。
 */
export function KeyboardEdge({ className }: { className?: string }) {
  const W = 24; // 白鍵1つの幅
  const blackAfter = [0, 1, 3, 4, 5]; // 黒鍵が右側に付く白鍵
  return (
    <svg aria-hidden className={className} width="100%" height="32" preserveAspectRatio="none">
      <defs>
        <pattern id="keyboard-edge-octave" width={W * 7} height="32" patternUnits="userSpaceOnUse">
          <rect width={W * 7} height="32" fill="#fbf9f4" />
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={i * W} y="0" width="1" height="32" fill="#12232e" fillOpacity="0.18" />
          ))}
          {blackAfter.map((i) => (
            <rect key={i} x={(i + 1) * W - 7} y="0" width="14" height="19" rx="2" fill="#17191b" />
          ))}
          <rect y="30" width={W * 7} height="2" fill="#12232e" fillOpacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="32" fill="url(#keyboard-edge-octave)" />
    </svg>
  );
}
