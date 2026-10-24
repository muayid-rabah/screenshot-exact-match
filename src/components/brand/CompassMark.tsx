import { cn } from "@/lib/utils";

/** Morshidi compass logo mark. Uses currentColor + gold token. */
export function CompassMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9", className)} aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" />
      <path d="M24 6 L28 24 L24 42 L20 24 Z" fill="var(--color-gold)" />
      <path d="M24 6 L28 24 L20 24 Z" fill="currentColor" opacity="0.9" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CompassMark />
      <div className="leading-tight">
        <div className={cn("font-display text-lg font-bold", inverted ? "text-ink-foreground" : "text-foreground")}>جامعة مرشدي</div>
        <div className="text-[10px] font-medium tracking-[0.25em] text-gold">MORSHIDI UNIVERSITY</div>
      </div>
    </div>
  );
}

/** Large geometric academic art for the login visual panel. */
export function CompassArt({ className }: { className?: string }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <svg viewBox="0 0 400 400" className={cn("w-full", className)} aria-hidden="true">
      <g className="origin-center animate-spin-slow" style={{ transformBox: "fill-box" }}>
        {ticks.map((a) => (
          <line key={a} x1="200" y1="18" x2="200" y2={a % 30 === 0 ? 34 : 26} stroke="var(--color-gold)"
            strokeWidth={a % 30 === 0 ? 2 : 1} opacity={a % 30 === 0 ? 0.9 : 0.4} transform={`rotate(${a} 200 200)`} />
        ))}
      </g>
      {[170, 130, 90].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="var(--color-ink-foreground)" strokeOpacity={0.12 + i * 0.06}
          strokeDasharray={i === 1 ? "2 6" : undefined} />
      ))}
      <path d="M60 300 C 140 260, 160 160, 240 140 S 330 90, 350 70" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7" />
      <path d="M50 230 C 120 230, 170 200, 200 200 S 300 250, 360 240" fill="none" stroke="var(--color-ink-foreground)" strokeOpacity="0.25" />
      {[[60, 300], [240, 140], [350, 70], [200, 200]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="var(--color-gold)" />
      ))}
      <path d="M200 60 L216 200 L200 340 L184 200 Z" fill="var(--color-gold)" opacity="0.9" />
      <path d="M200 60 L216 200 L184 200 Z" fill="var(--color-ink-foreground)" opacity="0.85" />
      <path d="M60 200 L200 188 L340 200 L200 212 Z" fill="var(--color-ink-foreground)" opacity="0.18" />
      <circle cx="200" cy="200" r="8" fill="var(--color-ink)" stroke="var(--color-gold)" strokeWidth="2" />
    </svg>
  );
}
