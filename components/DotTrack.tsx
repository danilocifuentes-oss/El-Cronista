"use client";

type Props = {
  value: number;
  max?: number;
  min?: number;
  onChange?: (v: number) => void;
  accent?: string;
  disabled?: boolean;
  /** true: gris monocromo; false: puntos acentados (vista CRT) */
  minimal?: boolean;
  /**
   * Primeros N puntos rellenos se pintan como “base” (gris/discretos).
   * El resto rellenos usan accent (jugador / distribución).
   */
  baselineFilled?: number;
};

export function DotTrack({
  value,
  max = 5,
  min = 0,
  onChange,
  disabled,
  accent = "var(--terminal)",
  minimal = true,
  baselineFilled = 0,
}: Props) {
  const n = Math.min(max, Math.max(min, value));
  const baseSlots = Math.max(0, Math.min(baselineFilled, max));

  return (
    <div
      className={`flex items-center gap-px font-mono text-[11px] tracking-tight select-none ${minimal ? "text-neutral-300" : ""}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < n;
        const isBaselineFill = filled && i < baseSlots;
        const isAccentFill = filled && i >= baseSlots;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            aria-label={`${i + 1}`}
            onClick={() => {
              const target = i + 1;
              if (target === n) onChange?.(Math.max(min, n - 1));
              else onChange?.(target);
            }}
            className={`rounded-sm px-[1px] leading-none disabled:opacity-40 ${
              disabled ? "cursor-default" : "cursor-pointer"
            } ${
              minimal
                ? filled
                  ? isBaselineFill
                    ? "text-neutral-500"
                    : "text-neutral-200"
                  : "text-neutral-700"
                : isBaselineFill
                  ? "text-neutral-500"
                  : isAccentFill
                    ? ""
                    : "text-neutral-600"
            } ${isAccentFill && !minimal && !disabled ? "hover:opacity-90" : ""} ${
              isBaselineFill && !minimal && !disabled ? "hover:opacity-90" : ""
            } ${!minimal && !filled ? "hover:opacity-90" : ""}`}
            style={!minimal && isAccentFill ? { color: accent, textShadow: `0 0 8px ${accent}55` } : undefined}
          >
            {filled ? "●" : "○"}
          </button>
        );
      })}
    </div>
  );
}
