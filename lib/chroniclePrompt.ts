import type { ChroniclePayload } from "@/lib/narrativeTypes";

export function formatChronicleForPrompt(ch?: ChroniclePayload): string {
  if (!ch) return "(sin bloque Génesis — usa solo tono por defecto Santiago gótico-punk.)";
  const parts = [
    ch.foundations?.trim() ? `CIMIENTOS_DEL_MUNDO:\n${ch.foundations.trim()}` : null,
    ch.AMBIENTE?.trim() ? `AMBIENTE (clima · ubicación · tono): ${ch.AMBIENTE.trim()}` : null,
    ch.TENSION?.trim() ? `TENSIÓN (Inquisición · conflictos internos · facciones): ${ch.TENSION.trim()}` : null,
    ch.ESTADO_GLOBAL?.trim()
      ? `ESTADO_GLOBAL (eventos activos en la ciudad): ${ch.ESTADO_GLOBAL.trim()}`
      : null,
    ch.VINCULO_HILOS?.trim()
      ? `VÍNCULO ENTRE HILOS (principal · paralela · en vivo): ${ch.VINCULO_HILOS.trim()}`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join("\n\n") : "(Génesis parcial — completa coherencia con el resto.)";
}
