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
  /**
   * Cuando viene definido, no puede subirse por encima en un solo clic:
   * evita pulsos ilegales y refuerza el “feel” del reparto gradual.
   */
  increaseCeiling?: number;
  /** Click que intentaría subir por encima de `increaseCeiling`. */
  onIncreaseBlocked?: (targetLevel: number) => void;
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
  increaseCeiling,
  onIncreaseBlocked,
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
        const targetLevel = i + 1;
        const blockIncrease =
          increaseCeiling !== undefined &&
          targetLevel > n &&
          targetLevel > increaseCeiling;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            aria-label={`${i + 1}`}
            aria-disabled={disabled === true ? true : blockIncrease === true ? true : undefined}
            title={blockIncrease ? "Valor bloqueado por las reglas de reparto vigentes." : undefined}
            onClick={() => {
              const target = targetLevel;
              if (target === n) {
                onChange?.(Math.max(min, n - 1));
                return;
              }
              if (blockIncrease && !disabled) {
                onIncreaseBlocked?.(target);
                return;
              }
              if (disabled) return;
              onChange?.(target);
            }}
            className={`rounded-sm px-[1px] leading-none disabled:opacity-40 ${
              disabled ? "cursor-default" : blockIncrease ? "cursor-not-allowed opacity-30" : "cursor-pointer"
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
