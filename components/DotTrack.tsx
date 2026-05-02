"use client";

type Props = {
  value: number;
  max?: number;
  /** Mínimo permitido al bajar pulsando el mismo dot (ej. atributos = 1) */
  min?: number;
  onChange?: (v: number) => void;
  accent: string;
  disabled?: boolean;
};

export function DotTrack({ value, max = 5, min = 0, onChange, accent, disabled }: Props) {
  const n = Math.min(max, Math.max(min, value));
  return (
    <div className="flex items-center gap-1 font-mono text-sm tracking-widest select-none">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < n;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            aria-label={`Puntos ${i + 1}`}
            onClick={() => {
              const target = i + 1;
              if (target === n) onChange?.(Math.max(min, n - 1));
              else onChange?.(target);
            }}
            className={`h-7 w-7 border transition-colors sharp-border-inner ${
              filled ? "opacity-100" : "opacity-35"
            } ${disabled ? "cursor-default" : "cursor-pointer hover:opacity-100"}`}
            style={{
              borderColor: accent,
              color: filled ? accent : `${accent}55`,
              boxShadow: filled ? `inset 0 0 12px ${accent}33` : undefined,
            }}
          >
            <span className="block translate-y-[1px] text-center">{filled ? "●" : "○"}</span>
          </button>
        );
      })}
    </div>
  );
}
