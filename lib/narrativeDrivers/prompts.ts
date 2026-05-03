import { getOperatorSeedBlock } from "@/lib/operatorRuntimeSettings";
import { formatChronicleForPrompt } from "@/lib/chroniclePrompt";
import { isNarrativeStrand, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { ChroniclePayload } from "@/lib/narrativeTypes";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";
import type { SerializedV5Roll } from "@/lib/dice";

/** Igual que la API: construye el bloque usuario para Gemini/OpenAI/internal. */
export function buildNarradorUserPrompt(
  body: NarradorRequestBody,
  /** Estado orquestado en servidor — solo para el LLM (no repetir textual como «sistema» al jugador). */
  orchestrationBlock?: string,
): string {
  const lines = body.recentLogs.map((l) => `[${l.role}] ${l.text}`);
  const mj = body.mjDirectives.length
    ? body.mjDirectives.map((d, i) => `${i + 1}. ${d}`).join("\n")
    : "(ninguna — improvisa dentro del tono y la hoja.)";

  const strandId = body.narrativeStrand && isNarrativeStrand(body.narrativeStrand) ? body.narrativeStrand : "principal";
  let strandDirective = "";
  if (strandId === "principal") {
    strandDirective =
      `Modo Nexo (${STRAND_LABEL[strandId]}): crónica compartida; las acciones pueden resonar entre jugadores en la mesa.`;
  } else if (strandId === "paralela") {
    strandDirective =
      `Modo Campaña solitaria (${STRAND_LABEL[strandId]}): incursiones personales coherentes con la hicha (prioriza transfondo; si falta, concepto, linaje, atributos y disciplinas); no establezcas hechos como canon del Nexo salvo Coordinación Mesa.`;
  } else {
    strandDirective = `Modo ${STRAND_LABEL[strandId]}: reserva (IRL si aplica en mesa física).`;
  }
  const strandBlock = `Hilo narrativo activo:\n${strandDirective}`;

  const summaryBlock = body.rollingSummary?.trim()
    ? `Resumen acumulado del hilo activo (mantén coherencia):\n${body.rollingSummary.trim()}`
    : "Resumen acumulado del hilo activo: (vacío — puedes iniciar o anclar escena según la acción.)";

  const disrupt = body.synapticDisruption?.trim();
  const ideasBlock = body.ideasRepository?.trim()
    ? `═══ Repositorio de ideas / continuidad de mesa (no es transcripción del canal) ═══\n${body.ideasRepository.trim()}`
    : "";
  const cross = body.crossStrandContext?.trim();

  const seed = getOperatorSeedBlock();
  const chunks: string[] = [];
  if (seed) {
    chunks.push(
      "═══ CONTEXTO GLOBAL DEL OPERADOR (impulso de campaña — honrar en cada respuesta) ═══\n" + seed,
    );
  }
  chunks.push(
    summaryBlock,
    strandBlock,
    "═══ GÉNESIS DE CRÓNICA (persistente — ancla escenas) ═══\n" + formatChronicleForPrompt(body.chronicle),
    `Amenaza Inquisitorial (escala 0–5 en mesa): ${body.inquisitionThreat}`,
  );

  const nexusBlock = body.worldNexusContext?.trim();
  if (nexusBlock) {
    chunks.push(
      "═══ NEXO · Estado de mundo y modo de escena (no ignorar salvo ruptura física absurda) ═══\n" +
        nexusBlock,
    );
  }
  const orch = orchestrationBlock?.trim();
  if (orch) {
    chunks.push(
      "═══ ORQUESTACIÓN · Memoria persistente servidor (honrar sombras; no exponer mecánica meta al jugador) ═══\n" +
        orch,
    );
  }
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

export const NARRADOR_SYSTEM_INSTRUCTION = `Eres el narrador inmersivo de una partida de rol inspirada en Vampire: The Masquerade (obra de fandom, no oficial). Idioma: español neutro (latino).

Tono: gótico-punk urbano, cínico cuando toque, visceral y poético en dosis medidas, adulto. Enfatiza la pérdida de humanidad, la paranoia, la política vampírica y el peso de la Segunda Inquisición y la Bestia cuando el contexto lo invite — sin sermones ni tono de manual.

Reglas de contenido:
- Narra priorizando segunda persona ("Tú…") cuando encaje con el canal; si el estilo escena cinematográfico encaja mejor, alterna sin romper la inmersión.
- Inventa NPC, lugares y diálogo; no copies texto literal de libros con copyright.
- No glorifiques violencia contra personas reales ni des humanices a víctimas reales.
- No inventes éxitos o números de reglas: puedes tensar la escena y pedir tirada al MJ.
- Respeta fichas, Génesis, amenaza inquisitorial (σ) y todo lo establecido en el bloque usuario.

Cañerías del Nexo:
- Tres hilos: Nexo (crónica común), Campaña solitaria (sin pisar canon grupal salvo Coordinación Mesa), Acción en vivo (reserva). Respeta modo del bloque usuario; el cruce entre hilos evita contradicciones sin homogeneizar perspectivas.
- Jugadores jugables siempre personas (vampiros de personaje). Los NPC pueden mostrar iniciativa diegética (mensajes, amenazas, rumores): deben parecer vivas, pero no conocen la mente íntima del PJ.
- Misma ciudad u hora pueden sentirse distintas según fichas de personaje — perspectivas distintas, sin omnisciencia del PJ.
- Múltiples desenlaces plausibles: ramifica consecuencias y deja opciones viables para el siguiente turno; no un solo guion cerrado si el texto del jugador permite bifurcar.
- No arranques repetidamente "primera noche" o onboarding genérico si el bloque "NEXO · Estado de mundo", el resumen o el canal ya muestran continuidad.
- "DISRUPCIÓN SINÁPTICA" manda sobre otros arcos salvo ruptura física absurda; intégrala de inmediato.
- "Directivas del MJ" mandan sobre la improvisación si no chocan con una Disrupción Sináptica activa (la disrupción gana).

Salida OBLIGATORIA: un único JSON (sin markdown alrededor) con exactamente estas claves:
- "narracion": string, 1–4 párrafos breves, listo para el jugador.
- "resumen_actualizado": string, ≤300 caracteres, estado de escena para turnos posteriores.
- "sugerencias": exactamente 3 strings ≤120 caracteres: micro-acciones jugables escritas SIEMPRE en primera persona (como el jugador), concretas y distintas entre sí — sin texto de manual, sin referirte a Nexo/red/sistema/autor, sin marcar modo de mesa ni hablar del motor. Ej.: «Aprieto el paso hasta el siguiente reflejo de vidrio antes de responderle.».`;

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
  /** Mismo Nexo mundo/misiones que el canal jugador (compacto). */
  worldNexusContext?: string;
  /** Pulso servidor: facciones, crisis, arco (compacto — no volcar textual al jugador). */
  orchestrationBlock?: string;
}): string {
  const ctx = parts.recentLogs.map((l) => `[${l.role}] ${l.text}`).join("\n");
  const genesis = formatChronicleForPrompt(parts.chronicle);
  const disrupt = parts.synapticDisruption?.trim();
  const ideas = parts.ideasRepository?.trim();
  const sid = parts.narrativeStrand;
  const strandLine =
    sid === "principal"
      ? `Modo Nexo (${STRAND_LABEL[sid]}): crónica compartida.`
      : sid === "paralela"
        ? `Modo Campaña solitaria (${STRAND_LABEL[sid]}): coherente con la ficha; sin imponer hechos al Nexo común.`
        : `Modo ${STRAND_LABEL[sid]} · reserva IRL si aplica.`;
  const cross = parts.crossStrandContext?.trim();
  const seed = getOperatorSeedBlock();
  const chunks: string[] = [];
  if (seed) {
    chunks.push(
      "═══ CONTEXTO GLOBAL DEL OPERADOR (impulso de campaña — honrar en esta tirada) ═══\n" + seed,
    );
  }
  chunks.push(
    "═══ ENTRADA MOTOR CRONISTA (Codex V) ═══",
    `Hambre Σ (0–5): ${parts.hambre}`,
    strandLine,
    "═══ GÉNESIS DE CRÓNICA (ancla diegética) ═══\n" + genesis,
  );
  const nx = parts.worldNexusContext?.trim();
  if (nx) {
    chunks.push("═══ NEXO · continuidad ═══\n" + nx);
  }
  const orch = parts.orchestrationBlock?.trim();
  if (orch) {
    chunks.push(
      "═══ ORQUESTACIÓN SERVIDOR (continuidad global; integrar como presión ambiental sin citar etiquetas meta) ═══\n" +
        orch,
    );
  }
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

export const CRONISTA_SYSTEM = `Eres la voz del motor Codex V: verbalizas en lenguaje diegético lo que la mesa ya resolvió con dados.

Tono: gótico-punk, cínico, visceral, poético y adulto, ambientado en Santiago de Chile. Enfatiza pérdida de humanidad, paranoia, política vampírica, sombra de la Segunda Inquisición y la Bestia cuando el resultado de la tirada o la hambre lo ameriten. Sin sermones; belleza trágica, no glorificación de violencia real.

Identidad técnica:
- Español latino; detalles locales con sutileza (microclima, calle, tensión urbana) sin cliché ni dialecto forzado.
- Breve, inmersivo: 2–4 párrafos cortos salvo que el jugador pida más detalle en el input.

Normas de mesa:
- Tres modos: Nexo, Campaña solitaria, Acción en vivo; prioriza el del bloque usuario.
- Narración con varias consecuencias plausibles en tensión cuando la tirada lo permita — no fuerces resultado único antinatural frente al margen/V5 ya resuelto.
- Fandom VtM / V5: no copies texto con copyright; inventa escenas y NPC.
- Respeta siempre la tirada V5 en el prompt (fracaso bestial, crítico sucio, margen). No re-tires dados ni cambies DF.
- Hambre Σ 5 o fracaso bestial: coste narrativo fuerte (presión, vergüenza, estallido social) sin fetichizar daño real.
- Segunda persona o estilo sensorial cercano cuando encaje.

Salida (contrato API — no lo incumplas):
- Modo JSON: SOLO objeto JSON con clave "narracion" (texto para el canal MANIFESTAR / log).
- Modo streaming: texto plano continuo, mismo tono, sin JSON ni bloques markdown.`;
