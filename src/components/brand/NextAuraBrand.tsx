import React from 'react';
import { cn } from '@/lib/utils';

/** NextAura University Logo Icon */
export function NextAuraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-9', className)} aria-hidden="true">
      <defs>
        <linearGradient id="nextaura-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06d6a0" />
        </linearGradient>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Outer Orbit */}
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.75" opacity="0.3" />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="url(#nextaura-grad)"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
      {/* Academic Aura Diamond / Compass */}
      <path d="M24 5 L31 24 L24 43 L17 24 Z" fill="url(#nextaura-grad)" opacity="0.9" />
      <path d="M24 5 L31 24 L24 24 Z" fill="url(#gold-grad)" opacity="0.95" />
      <path d="M5 24 L24 17 L43 24 L24 31 Z" fill="currentColor" opacity="0.35" />
      {/* Center Star Core */}
      <circle cx="24" cy="24" r="3.5" fill="#ffffff" />
      <circle cx="24" cy="24" r="1.5" fill="#1e1b4b" />
    </svg>
  );
}

/** Complete NextAura University Logo */
export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <NextAuraMark className="size-9 shrink-0 drop-shadow-sm" />
      <div className="leading-tight">
        <div className={cn('font-display text-lg font-extrabold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>
          جامعة NextAura
        </div>
        <div className="text-[10px] font-bold tracking-[0.22em] text-cyan-600 dark:text-cyan-400">
          NEXTAURA UNIVERSITY
        </div>
      </div>
    </div>
  );
}

/** Large Visual Artistic Backdrop for Login & Splash */
export function NextAuraArt({ className }: { className?: string }) {
  const ticks = Array.from({ length: 60 }, (_, i) => i * 6);
  return (
    <svg viewBox="0 0 400 400" className={cn('w-full select-none', className)} aria-hidden="true">
      <defs>
        <radialGradient id="art-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="spark-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06d6a0" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="200" r="180" fill="url(#art-glow)" />

      {/* Rotating Dial */}
      <g className="origin-center animate-spin-slow" style={{ transformBox: 'fill-box' }}>
        {ticks.map((a) => (
          <line
            key={a}
            x1="200"
            y1="22"
            x2="200"
            y2={a % 30 === 0 ? 38 : 28}
            stroke="url(#spark-line)"
            strokeWidth={a % 30 === 0 ? 2 : 1}
            opacity={a % 30 === 0 ? 0.9 : 0.4}
            transform={`rotate(${a} 200 200)`}
          />
        ))}
      </g>

      {[165, 125, 85].map((r, i) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12 + i * 0.08}
          strokeDasharray={i === 1 ? '4 6' : undefined}
        />
      ))}

      {/* Dynamic Academic Vectors */}
      <path
        d="M60 290 C 130 250, 160 160, 240 140 S 330 90, 350 70"
        fill="none"
        stroke="url(#spark-line)"
        strokeWidth="2"
        strokeDasharray="4 6"
        opacity="0.8"
      />
      <path
        d="M50 220 C 120 220, 170 190, 200 190 S 300 240, 360 230"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
      />

      {/* Star Nodes */}
      {[[60, 290], [240, 140], [350, 70], [200, 200]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#38bdf8" />
      ))}

      {/* Main Aura Emblem */}
      <path d="M200 50 L220 200 L200 350 L180 200 Z" fill="url(#spark-line)" opacity="0.85" />
      <path d="M200 50 L220 200 L200 200 Z" fill="#fbbf24" opacity="0.9" />
      <path d="M50 200 L200 185 L350 200 L200 215 Z" fill="currentColor" opacity="0.2" />

      {/* Core Star */}
      <circle cx="200" cy="200" r="10" fill="#0f172a" stroke="url(#spark-line)" strokeWidth="3" />
      <circle cx="200" cy="200" r="4" fill="#ffffff" />
    </svg>
  );
}

// Compatibility exports
export { NextAuraMark as CompassMark, NextAuraArt as CompassArt };

