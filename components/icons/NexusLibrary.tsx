"use client";

import type { CSSProperties } from "react";

const transition = "transition-[stroke,opacity,transform] duration-500 ease-in-out";
const selectNone = "select-none shrink-0";

export type NexusGlyphColorProps = {
  className?: string;
  color?: string;
  /** Pulso por estado (σ, alerta). */
  pulse?: boolean;
};

/** Capa de red: trazos tenues animados vía CSS global `.nexo-glyph-dash`. */
function NetLayer({ stroke, opacity = 0.22 }: { stroke: string; opacity?: number }) {
  return (
    <g className={`nexo-glyph-dash ${selectNone}`} style={{ opacity }}>
      <path d="M2 8h20M4 16h16M6 4l4 16M14 4l-4 16" stroke={stroke} strokeWidth="0.45" fill="none" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

export const NexusLibrary = {
  Vastago: ({ className = "h-6 w-6", color = "var(--terminal)" }: NexusGlyphColorProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={`${transition} ${selectNone} ${className}`} aria-hidden>
      <NetLayer stroke={color} opacity={0.18} />
      <path
        d="M12 2.5 4.2 20.5h15.6L12 2.5z"
        stroke={color}
        strokeWidth="1.35"
        strokeLinejoin="miter"
        fill="none"
      />
      <path d="M12 8.5v7M9.2 12h5.6" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity={0.55} />
      <circle cx="12" cy="12" r="9.2" stroke={color} strokeWidth="0.45" strokeDasharray="1.8 2.8" fill="none" />
    </svg>
  ),

  Inquisicion: ({
    className = "h-6 w-6",
    sigma = 0,
  }: NexusGlyphColorProps & { sigma?: number }) => {
    const s = Math.max(0, Math.min(5, Math.round(sigma)));
    const hot = s > 3;
    const stroke = hot ? "var(--blood)" : "var(--terminal)";
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`${transition} ${selectNone} ${className} ${hot ? "nexo-glyph-sigma-pulse" : ""}`}
        aria-hidden
      >
        <NetLayer stroke={stroke} opacity={hot ? 0.28 : 0.2} />
        <circle cx="12" cy="12" r="9.5" stroke={stroke} strokeWidth="1.35" fill="rgba(0,0,0,0.15)" />
        <path d="M12 8.2v3.6M12 16.2h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        {Array.from({ length: s }).map((_, i) => (
          <rect
            key={i}
            x={4 + i * 3.2}
            y="20"
            width="1.8"
            height="2.2"
            fill={stroke}
            opacity={0.35 + i * 0.12}
          />
        ))}
      </svg>
    );
  },

  Destino: ({ className = "h-6 w-6", color = "currentColor" }: NexusGlyphColorProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={`${transition} ${selectNone} ${className}`} aria-hidden>
      <NetLayer stroke={color} opacity={0.2} />
      <path
        d="M12 2.2 20.4 7.1v9.8L12 21.8 3.6 16.9V7.1L12 2.2z"
        stroke={color}
        strokeWidth="1.15"
        fill="none"
      />
      <path
        d="M12 2.2v19.6M3.6 7.1l16.8 9.8M3.6 16.9 20.4 7.1"
        stroke={color}
        strokeWidth="0.5"
        strokeOpacity={0.35}
      />
    </svg>
  ),

  /** Eco del canal / narración (terminal). */
  Cronista: ({ className = "h-6 w-6", color = "var(--terminal)" }: NexusGlyphColorProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={`${transition} ${selectNone} ${className}`} aria-hidden>
      <NetLayer stroke={color} />
      <path d="M4.5 5h15v11H4.5z" stroke={color} strokeWidth="1.25" fill="rgba(0,0,0,0.2)" />
      <path d="M7.2 8.4h9.6M7.2 11.6h5.8" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity={0.55} />
      <path d="M2.5 19.5 5.5 16.5" stroke={color} strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  ),

  Sangre: ({ className = "h-6 w-6", pulse }: NexusGlyphColorProps & { pulse?: boolean }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${transition} ${selectNone} ${className} ${pulse ? "nexo-glyph-blood-pulse" : ""}`}
      aria-hidden
    >
      <path
        d="M12 3.2c-3.2 4.2-6 7.4-6 11.1 0 3.2 2.7 5.7 6 5.7s6-2.5 6-5.7c0-3.7-2.8-6.9-6-11.1z"
        stroke="var(--crimson)"
        strokeWidth="1.2"
        fill="rgba(159,18,57,0.12)"
      />
      <path d="M12 8.2v5.2" stroke="var(--blood)" strokeWidth="1" strokeLinecap="round" opacity={0.85} />
    </svg>
  ),

  Circuit: ({ className = "h-6 w-6", color = "var(--terminal)" }: NexusGlyphColorProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={`${transition} ${selectNone} ${className}`} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="1" stroke={color} strokeWidth="0.9" strokeDasharray="3 2" fill="none" />
      <circle cx="8" cy="10" r="2" stroke={color} strokeWidth="0.8" fill="none" />
      <circle cx="16" cy="14" r="2" stroke={color} strokeWidth="0.8" fill="none" />
      <path d="M10 10h4l2 4" stroke={color} strokeWidth="0.7" opacity={0.6} />
    </svg>
  ),
};

export type MaterialSchreckProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

/** Material Symbols Sharp — requiere `<link>` en `app/layout.tsx`. */
export function MaterialSchreckIcon({ name, className = "", style }: MaterialSchreckProps) {
  return (
    <span className={`material-symbols-sharp schreck-ms-icon ${className}`} style={style} aria-hidden>
      {name}
    </span>
  );
}
