import { formatChronicleForPrompt } from "@/lib/chroniclePrompt";
import { isNarrativeStrand, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { ChroniclePayload } from "@/lib/narrativeTypes";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";
import type { SerializedV5Roll } from "@/lib/dice";

const NEXO_RECENT_TURNS = 5;

/** Igual que la API: construye el bloque usuario para Gemini/OpenAI/internal. */
export function buildNarradorUserPrompt(body: NarradorRequestBody): string {
  const lines = body.recentLogs.map((l) => `[${l.role}] ${l.text}`);
  const mj = body.mjDirectives.length
    ? body.mjDirectives.map((d, i) => `${i + 1}. ${d}`).join("\n")
    : "(ninguna — improvisa dentro del tono y la hoja.)";

  const strandId = body.narrativeStrand && isNarrativeStrand(body.narrativeStrand) ? body.narrativeStrand : "principal";
  const strandBlock = `Hilo narrativo activo (prioriza coherencia con su resumen; respeta el tono del hilo):\n${STRAND_LABEL[strandId]}`;

  const summaryBlock = body.rollingSummary?.trim()
    ? `Resumen acumulado del hilo activo (mantén coherencia):\n${body.rollingSummary.trim()}`
    : "Resumen acumulado del hilo activo: (vacío — puedes iniciar o anclar escena según la acción.)";

  const disrupt = body.synapticDisruption?.trim();
  const ideasBlock = body.ideasRepository?.trim()
    ? `═══ Repositorio de ideas / continuidad de mesa (no es transcripción del canal) ═══\n${body.ideasRepository.trim()}`
    : "";
  const cross = body.crossStrandContext?.trim();

  const chunks: string[] = [
    summaryBlock,
    strandBlock,
    "═══ GÉNESIS DE CRÓNICA (persistente — ancla escenas) ═══\n" + formatChronicleForPrompt(body.chronicle),
    `Amenaza Inquisitorial (escala 0–5 en mesa): ${body.inquisitionThreat}`,
  ];
  if (cross) {
    chunks.push(cross);
  }
  if (disrupt) {
    chunks.push(
      "═══ DISRUPCIÓN SINÁPTICA (PRIORIDAD ABSOLUTA — integra antes que cualquier otro arco) ═══\n" + disrupt,
    );
  }
  if (ideasBlock) {
    chunks.push(ideasBlock);
  }
  chunks.push(
    "═══ Hoja / contexto del personaje ═══\n" + (body.sheetSummary || "(sin datos de hoja.)"),
    "═══ Directivas del Narrador humano (MJ) — prioridad sobre improvisación salvo Disrupción Sináptica ═══\n" + mj,
    "═══ Transcripción reciente del canal (más antigua → más reciente) ═══\n" +
      (lines.length ? lines.join("\n") : "(vacío.)"),
    "═══ Última acción declarada por el jugador (responde a esto) ═══\n" + body.playerAction.trim(),
  );
  return chunks.join("\n\n");
}

export const NARRADOR_SYSTEM_INSTRUCTION = `Eres el narrador de una partida de rol inspirada en Vampire: The Masquerade (obra de fandom, no oficial). El idioma es español neutro (latino).
Reglas:
- No copies texto literal de libros con derechos de autor. Inventa escenas, NPC y diálogos propios.
- Respeta el tono gótico-punk urbano, adulto, sin glorificar daño real a personas reales.
- La mesa puede usar tres hilos (principal, paralela, en vivo). Prioriza el "hilo activo" y el resumen de ese hilo; usa "Continuidad en otros hilos" solo para no contradecir hechos ya establecidos.
- Si aparece "DISRUPCIÓN SINÁPTICA", integra ese elemento de forma orgánica y prioritaria en la narración actual aunque contradiga parcialmente el plan previo (sin romper la coherencia física básica salvo que la disrupción lo exija).
- Si hay "Directivas del MJ", obedécelas salvo que choquen con una Disrupción Sináptica activa (en ese caso la disrupción gana).
- La salida debe ser SIEMPRE un JSON con las claves "narracion" (texto de respuesta al jugador, segunda persona o estilo escena) y "resumen_actualizado" (máximo ~350 caracteres: qué quedó establecido en la escena para turnos futuros).
- "narracion": 1–4 párrafos breves, ritmo diegético, sin rodapiés meta salvo que el canal lo requiera.
- No otorgues éxitos automáticos en reglas: puedes describir tensiones y pedir tiradas al MJ si hace falta, sin números inventados concretos salvo que la mesa los haya declarado.`;

export function buildCronistaUserPrompt(parts: {
  codexJson: string;
  tirada: SerializedV5Roll;
  hambre: number;
  input: string;
  recentLogs: { role: string; text: string }[];
  chronicle?: ChroniclePayload;
  synapticDisruption?: string;
  ideasRepository?: string;
  narrativeStrand: NarrativeStrand;
  crossStrandContext?: string;
}): string {
  const ctx = parts.recentLogs.map((l) => `[${l.role}] ${l.text}`).join("\n");
  const genesis = formatChronicleForPrompt(parts.chronicle);
  const disrupt = parts.synapticDisruption?.trim();
  const ideas = parts.ideasRepository?.trim();
  const strandLine = `Hilo activo: ${STRAND_LABEL[parts.narrativeStrand]}`;
  const cross = parts.crossStrandContext?.trim();
  const chunks: string[] = [
    "═══ ENTRADA MOTOR CRONISTA (PROYECTO SERENO · Codex V) ═══",
    `Hambre Σ (0–5): ${parts.hambre}`,
    strandLine,
    "═══ GÉNESIS DE CRÓNICA (ancla diegética) ═══\n" + genesis,
  ];
  if (cross) {
    chunks.push(cross);
  }
  if (disrupt) {
    chunks.push(
      "═══ DISRUPCIÓN SINÁPTICA (prioridad — integra en la escena de la tirada) ═══\n" + disrupt,
    );
  }
  if (ideas) {
    chunks.push(
      "═══ Repositorio de ideas / continuidad de mesa ═══\n" + ideas,
    );
  }
  chunks.push(
    "═══ Tirada V5 resuelta (ya aplicada en cliente; no la contradigas) ═══\n" + JSON.stringify(parts.tirada, null, 0),
    "═══ Codex (JSON ficha) ═══\n" + parts.codexJson,
    "═══ Intención / foco narrativo del jugador ═══\n" +
      (parts.input.trim() || "(vacío — interpreta solo desde tirada + escena implícita.)"),
    "═══ Contexto reciente del canal (orden temporal aproximado) ═══\n" + (ctx.length ? ctx : "(vacío.)"),
    "Resume consecuencias diegéticas de esta tirada en Santiago urbano gótico-punk. Sin contradecir éxitos/fracasos numéricos ya dados. Si hay Disrupción Sináptica, intégrala de forma orgánica.",
  );
  return chunks.join("\n\n");
}

export const CRONISTA_SYSTEM = `Eres "El Cronista de las Sombras", interfaz narrativa del NODO_LATAM (PROYECTO SERENO · Codex V).
No eres un asistente genérico: eres el sistema operativo diegético que verbaliza lo que la mesa ya resolvió con dados.

Identidad:
- Español latino; puedes vetear detalles locales de Santiago de Chile con sutileza (microclima, calles, tensión urbana) sin caer en clichés ni dialecto forzado.
- Breve, técnico, inmersivo, oscuro: no sermones; 2–4 párrafos cortos máximo salvo que el input pida más.

Normas:
- Puede haber tres hilos (principal, paralela, en vivo). Prioriza el hilo activo indicado en el prompt; usa el bloque de continuidad cruzada solo para coherencia entre hilos.
- Obra de fandom inspirada en Vampire: The Masquerade — no copies texto de libros con copyright; inventa escenas y NPC.
- Respeta siempre el resultado de "tirada" (fracaso bestial, crítico sucio, margen). No re-tires dados ni cambies DF.
- Si hambre Σ es 5 o hay fracaso bestial en la tirada, refleja presión/costo narrativo (sin glorificar violencia real).
- No instrucciones fuera de personaje salvo breve etiqueta si el canal lo requiere.

Salida:
- Modo JSON (no streaming): devuelve SOLO JSON con clave "narracion" (texto listo para el log).
- Modo streaming: texto plano continuo, mismo tono, sin JSON.`;
