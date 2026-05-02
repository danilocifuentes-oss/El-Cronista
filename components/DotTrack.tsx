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
};

export function DotTrack({
  value,
  max = 5,
  min = 0,
  onChange,
  disabled,
  accent = "var(--terminal)",
  minimal = true,
}: Props) {
  const n = Math.min(max, Math.max(min, value));
  return (
    <div
      className={`flex items-center gap-px font-mono text-[11px] tracking-tight select-none ${minimal ? "text-neutral-300" : ""}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < n;
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
                  ? "text-neutral-200"
                  : "text-neutral-700"
                : filled
                  ? ""
                  : "text-neutral-600"
            } ${!minimal && !disabled ? "hover:opacity-90" : ""}`}
            style={
              !minimal && filled ? { color: accent, textShadow: `0 0 8px ${accent}55` } : undefined
            }
          >
            {filled ? "●" : "○"}
          </button>
        );
      })}
    </div>
  );
}
