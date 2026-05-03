export const NARRATIVE_STRANDS = ["principal", "paralela", "vivo"] as const;
export type NarrativeStrand = (typeof NARRATIVE_STRANDS)[number];

export type RollingByStrand = Record<NarrativeStrand, string>;

export const STRAND_LABEL: Record<NarrativeStrand, string> = {
  principal: "Principal",
  paralela: "Paralela",
  vivo: "En vivo",
};

/** Etiqueta corta para chips de UI. */
export const STRAND_TAG: Record<NarrativeStrand, string> = {
  principal: "PRIN",
  paralela: "PAR",
  vivo: "IRL",
};

export const STRAND_HELPLINE: Record<NarrativeStrand, string> = {
  principal: "Arco central / sesiones SchreckNet habituales.",
  paralela: "Subtramas, PBP, escenas alternas sin romper el arco.",
  vivo: "Mesa física — mismo CV; tono presente, continuidad enlazada.",
};

/** Color CSS (borde / acento del stream). */
export const STRAND_ACCENT: Record<NarrativeStrand, string> = {
  principal: "var(--terminal)",
  paralela: "#a78bfa",
  vivo: "#f59e0b",
};

export function isNarrativeStrand(s: string): s is NarrativeStrand {
  return (NARRATIVE_STRANDS as readonly string[]).includes(s);
}

export function normalizeStrand(s: unknown): NarrativeStrand {
  if (typeof s === "string" && isNarrativeStrand(s)) return s;
  return "principal";
}

export function defaultRollingByStrand(): RollingByStrand {
  return { principal: "", paralela: "", vivo: "" };
}

export function normalizeRollingByStrand(raw: unknown): RollingByStrand {
  const base = defaultRollingByStrand();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  for (const k of NARRATIVE_STRANDS) {
    if (typeof o[k] === "string") {
      base[k] = o[k].slice(0, 2000);
    }
  }
  return base;
}

/** Texto compacto para el prompt: otros hilos vs el activo (continuidad cruzada). */
export function buildCrossStrandContext(active: NarrativeStrand, by: RollingByStrand): string {
  const parts: string[] = [];
  for (const k of NARRATIVE_STRANDS) {
    if (k === active) continue;
    const t = by[k]?.trim();
    if (t) {
      const clip = t.length > 700 ? `${t.slice(0, 700)}…` : t;
      parts.push(`· ${STRAND_LABEL[k]}: ${clip}`);
    }
  }
  if (!parts.length) return "";
  return [
    "═══ Continuidad en otros hilos (no sustituyen el hilo activo; evita contradicciones) ═══",
    ...parts,
  ].join("\n");
}
