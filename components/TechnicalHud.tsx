"use client";

/** HUD esquina: vitalidad verde (# integridad física), hambre roja silenciosa. Sin etiquetas. */
type Props = {
  healthFilled: number;
  healthMax: number;
  hunger: number;
};

export function TechnicalHud({ healthFilled, healthMax, hunger }: Props) {
  const h = Math.max(0, Math.min(5, hunger));
  const hf = Math.max(0, Math.min(healthMax, healthFilled));
  return (
    <div
      className="fixed right-4 top-4 z-[120] flex flex-col items-end gap-2 rounded border border-neutral-900/90 bg-black/40 px-2 py-2 backdrop-blur-[2px]"
      aria-label={`Integridad visual ${hf} de ${healthMax}; estrés hematófago ${h} de cinco`}
    >
      <div className="flex gap-1" title="Índice de integridad (verde)" aria-hidden>
        {Array.from({ length: healthMax }, (_, i) => (
          <span
            key={`v-${i}`}
            className={`h-2 w-2 rounded-full ${i < hf ? "bg-emerald-600/95 shadow-[0_0_6px_rgba(22,163,74,0.45)]" : "border border-emerald-900/50 bg-transparent"}`}
          />
        ))}
      </div>
      <div className="flex gap-1" title="Presión hematófaga (rojo)" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={`r-${i}`}
            className={`h-2 w-2 rounded-full ${i < h ? "bg-[var(--blood)] shadow-[0_0_8px_rgba(139,0,0,0.5)]" : "border border-red-950/70 bg-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}
