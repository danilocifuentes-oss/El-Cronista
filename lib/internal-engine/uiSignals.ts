import type { NarrativeLogEntry } from "@/lib/narrativeTypes";

export type NexoStreamVisualContext = {
  showTechnicalAnchors: boolean;
  reduceMotion: boolean;
};

/**
 * Clases Tailwind para la tarjeta de log (stream SchreckNet).
 * Centraliza criterios del motor Nexo (σ, Bestia, rol, modo técnico).
 */
export function getTailwindClassesForNexoLogArticle(
  entry: NarrativeLogEntry,
  ctx: NexoStreamVisualContext,
): string {
  if (entry.role === "sistema") {
    return `max-w-[96%] font-mono text-[10px] leading-relaxed ${
      entry.sigmaGlitch ? "nexo-sigma-whisper text-red-400/[0.72]" : "text-neutral-600"
    }`;
  }
  if (ctx.showTechnicalAnchors) {
    return `max-w-[96%] font-mono text-[10px] leading-relaxed ${
      entry.role === "narrador"
        ? entry.cronistaOut
          ? "border-l border-[var(--terminal)]/25 pl-3 text-neutral-300"
          : "border-l border-[#252525] pl-3 text-neutral-500"
        : "border-l border-[#252525] pl-3 text-neutral-400"
    }`;
  }
  return `max-w-[min(48rem,96%)] rounded-sm font-sans text-[15px] leading-relaxed tracking-[0.02em] ${
    entry.role === "narrador"
      ? entry.cronistaOut
        ? "border-l-2 border-[var(--terminal)]/35 bg-white/[0.02] py-4 pl-4 text-neutral-200"
        : "border-l-2 border-[var(--terminal)]/25 bg-white/[0.02] py-4 pl-4 text-neutral-300"
      : "border-r-2 border-neutral-800 bg-black/20 py-4 pr-4 text-neutral-300"
  }`;
}

/** Clases del cuerpo de texto (p) según Cronista vs canal y acento Bestia. */
export function getTailwindClassesForNexoLogProse(entry: NarrativeLogEntry): string {
  if (entry.role === "narrador" && entry.cronistaOut) {
    return `cronista-out-text whitespace-pre-wrap selection:bg-terminal/30${entry.beastTone ? " blood-shiver" : ""}`;
  }
  if (entry.role === "narrador" || entry.role === "jugador") {
    return `whitespace-pre-wrap text-neutral-300 selection:bg-terminal/25${
      entry.role === "narrador" && entry.beastTone ? " blood-shiver" : ""
    }`;
  }
  return "whitespace-pre-wrap text-neutral-300 selection:bg-terminal/25";
}
