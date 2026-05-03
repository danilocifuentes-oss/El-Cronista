import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

import { formatChronicleForPrompt } from "@/lib/chroniclePrompt";
import {
  isQuotaOrRateLimitError,
  resolveGeminiModels,
  withExponentialBackoff,
} from "@/lib/geminiRetry";
import { resolveGeminiApiKey } from "@/lib/geminiEnv";
import { formatNexoApiFailure } from "@/lib/nexoErrors";
import { isNarrativeStrand, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { ChroniclePayload, NarradorRequestBody } from "@/lib/narrativeTypes";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ACTION = 4500;
const MAX_LINE = 1800;
/** Solo los últimos turnos al motor (ahorra tokens y presión de cuota). */
const NEXO_RECENT_TURNS = 5;
const MAX_SHEET_SUMMARY = 4500;
const MAX_CHRON = 8000;
const MAX_SYNAPTIC = 4000;
const MAX_IDEAS = 6000;
const MAX_CROSS = 4000;

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.length <= max ? s : `${s.slice(0, max)}\n[…]`;
}

function normalizeBody(raw: unknown): NarradorRequestBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const playerAction = clampStr(o.playerAction, MAX_ACTION);
  if (!playerAction.trim()) return null;

  const sheetSummary = clampStr(o.sheetSummary, MAX_SHEET_SUMMARY);
  const threat = Number(o.inquisitionThreat);
  const inquisitionThreat =
    Number.isFinite(threat) ? Math.max(0, Math.min(5, Math.round(threat))) : 0;

  let recentLogs: NarradorRequestBody["recentLogs"] = [];
  if (Array.isArray(o.recentLogs)) {
    recentLogs = o.recentLogs
      .slice(-NEXO_RECENT_TURNS)
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const role = typeof r.role === "string" ? r.role.slice(0, 24) : "?";
        const text = clampStr(r.text, MAX_LINE);
        return text.trim() ? { role, text } : null;
      })
      .filter((x): x is { role: string; text: string } => Boolean(x));
  }

  let mjDirectives: string[] = [];
  if (Array.isArray(o.mjDirectives)) {
    mjDirectives = o.mjDirectives
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => clampStr(x, 4000))
      .slice(-14);
  }

  const rollingSummary = o.rollingSummary ? clampStr(o.rollingSummary, 4000) : "";

  let chronicle: ChroniclePayload | undefined;
  if (o.chronicle && typeof o.chronicle === "object") {
    const c = o.chronicle as Record<string, unknown>;
    chronicle = {
      foundations: clampStr(c.foundations, MAX_CHRON),
      AMBIENTE: clampStr(c.AMBIENTE, 2000),
      TENSION: clampStr(c.TENSION, 2000),
      ESTADO_GLOBAL: clampStr(c.ESTADO_GLOBAL, 2000),
      VINCULO_HILOS: c.VINCULO_HILOS ? clampStr(c.VINCULO_HILOS, 2000) : undefined,
    };
  }

  const synapticDisruption = o.synapticDisruption ? clampStr(o.synapticDisruption, MAX_SYNAPTIC) : "";
  const ideasRepository = o.ideasRepository ? clampStr(o.ideasRepository, MAX_IDEAS) : "";
  const narrativeStrandRaw = typeof o.narrativeStrand === "string" ? o.narrativeStrand : "";
  const narrativeStrand: NarrativeStrand = isNarrativeStrand(narrativeStrandRaw) ? narrativeStrandRaw : "principal";
  const crossStrandContext = o.crossStrandContext ? clampStr(o.crossStrandContext, MAX_CROSS) : "";

  return {
    playerAction,
    recentLogs,
    sheetSummary,
    inquisitionThreat,
    mjDirectives,
    rollingSummary: rollingSummary.trim() || undefined,
    chronicle,
    synapticDisruption: synapticDisruption.trim() || undefined,
    ideasRepository: ideasRepository.trim() || undefined,
    narrativeStrand,
    crossStrandContext: crossStrandContext.trim() || undefined,
  };
}

function buildUserPrompt(body: NarradorRequestBody): string {
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

const SYSTEM_INSTRUCTION = `Eres el narrador de una partida de rol inspirada en Vampire: The Masquerade (obra de fandom, no oficial). El idioma es español neutro (latino).
Reglas:
- No copies texto literal de libros con derechos de autor. Inventa escenas, NPC y diálogos propios.
- Respeta el tono gótico-punk urbano, adulto, sin glorificar daño real a personas reales.
- La mesa puede usar tres hilos (principal, paralela, en vivo). Prioriza el "hilo activo" y el resumen de ese hilo; usa "Continuidad en otros hilos" solo para no contradecir hechos ya establecidos.
- Si aparece "DISRUPCIÓN SINÁPTICA", integra ese elemento de forma orgánica y prioritaria en la narración actual aunque contradiga parcialmente el plan previo (sin romper la coherencia física básica salvo que la disrupción lo exija).
- Si hay "Directivas del MJ", obedécelas salvo que choquen con una Disrupción Sináptica activa (en ese caso la disrupción gana).
- La salida debe ser SIEMPRE un JSON con las claves "narracion" (texto de respuesta al jugador, segunda persona o estilo escena) y "resumen_actualizado" (máximo ~350 caracteres: qué quedó establecido en la escena para turnos futuros).
- "narracion": 1–4 párrafos breves, ritmo diegético, sin rodapiés meta salvo que el canal lo requiera.
- No otorgues éxitos automáticos en reglas: puedes describir tensiones y pedir tiradas al MJ si hace falta, sin números inventados concretos salvo que la mesa los haya declarado.`;

function getNarradorModel(genAI: GoogleGenerativeAI, modelName: string) {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    generationConfig: {
      temperature: 0.88,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          narracion: {
            type: SchemaType.STRING,
            description: "Continuación narrativa inmersiva para el jugador.",
          },
          resumen_actualizado: {
            type: SchemaType.STRING,
            description: "Resumen breve del estado de escena para coherencia (≤350 caracteres).",
          },
        },
        required: ["narracion", "resumen_actualizado"],
      },
    },
  });
}

async function generateNarradorJson(
  genAI: GoogleGenerativeAI,
  modelName: string,
  userPrompt: string,
): Promise<{ narracion: string; resumen_actualizado?: string }> {
  const model = getNarradorModel(genAI, modelName);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  });
  const raw = result.response.text().trim();
  if (!raw) {
    throw new Error("El modelo no devolvió texto (posible bloqueo de seguridad).");
  }
  let parsed: { narracion?: string; resumen_actualizado?: string };
  try {
    parsed = JSON.parse(raw) as { narracion?: string; resumen_actualizado?: string };
  } catch {
    throw new Error("No se pudo parsear JSON del modelo.");
  }
  const narration = typeof parsed.narracion === "string" ? parsed.narracion.trim() : "";
  if (!narration) {
    throw new Error("narracion vacía.");
  }
  return {
    narracion: narration,
    resumen_actualizado:
      typeof parsed.resumen_actualizado === "string" ? parsed.resumen_actualizado.trim().slice(0, 2000) : undefined,
  };
}

export async function POST(req: Request) {
  const key = resolveGeminiApiKey();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Sin clave Gemini en el servidor. Define GEMINI_API_KEY en .env.local o en Vercel → Environment Variables (Production), redeploy.",
      },
      { status: 503 },
    );
  }

  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = normalizeBody(rawJson);
  if (!body) {
    return NextResponse.json({ error: "playerAction requerido o vacío." }, { status: 400 });
  }

  const { primary, fallback } = resolveGeminiModels();
  const genAI = new GoogleGenerativeAI(key);
  const userPrompt = buildUserPrompt(body);

  try {
    let parsed: { narracion: string; resumen_actualizado?: string };
    try {
      parsed = await withExponentialBackoff(
        () => generateNarradorJson(genAI, primary, userPrompt),
        { maxAttempts: 4, baseDelayMs: 1800, label: primary },
      );
    } catch (e1) {
      if (!isQuotaOrRateLimitError(e1) || primary === fallback) throw e1;
      console.warn("[api/narrador] fallback →", fallback);
      parsed = await withExponentialBackoff(
        () => generateNarradorJson(genAI, fallback, userPrompt),
        { maxAttempts: 3, baseDelayMs: 1600, label: fallback },
      );
    }

    return NextResponse.json({
      narration: parsed.narracion,
      rollingSummary: parsed.resumen_actualizado || undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/narrador]", msg);
    const immersive = formatNexoApiFailure(msg);
    const status = isQuotaOrRateLimitError(e) ? 503 : 502;
    return NextResponse.json({ error: immersive }, { status });
  }
}
