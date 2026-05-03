import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

import { formatChronicleForPrompt } from "@/lib/chroniclePrompt";
import type { ChroniclePayload, NarradorRequestBody } from "@/lib/narrativeTypes";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ACTION = 4500;
const MAX_LINE = 3500;
const MAX_LOG_LINES = 35;
const MAX_CHRON = 12000;
const MAX_SYNAPTIC = 4000;

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.length <= max ? s : `${s.slice(0, max)}\n[…]`;
}

function normalizeBody(raw: unknown): NarradorRequestBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const playerAction = clampStr(o.playerAction, MAX_ACTION);
  if (!playerAction.trim()) return null;

  const sheetSummary = clampStr(o.sheetSummary, 12000);
  const threat = Number(o.inquisitionThreat);
  const inquisitionThreat =
    Number.isFinite(threat) ? Math.max(0, Math.min(5, Math.round(threat))) : 0;

  let recentLogs: NarradorRequestBody["recentLogs"] = [];
  if (Array.isArray(o.recentLogs)) {
    recentLogs = o.recentLogs
      .slice(-MAX_LOG_LINES)
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
    };
  }

  const synapticDisruption = o.synapticDisruption ? clampStr(o.synapticDisruption, MAX_SYNAPTIC) : "";

  return {
    playerAction,
    recentLogs,
    sheetSummary,
    inquisitionThreat,
    mjDirectives,
    rollingSummary: rollingSummary.trim() || undefined,
    chronicle,
    synapticDisruption: synapticDisruption.trim() || undefined,
  };
}

function buildUserPrompt(body: NarradorRequestBody): string {
  const lines = body.recentLogs.map((l) => `[${l.role}] ${l.text}`);
  const mj = body.mjDirectives.length
    ? body.mjDirectives.map((d, i) => `${i + 1}. ${d}`).join("\n")
    : "(ninguna — improvisa dentro del tono y la hoja.)";

  const summaryBlock = body.rollingSummary?.trim()
    ? `Resumen acumulado de la sesión (mantén coherencia):\n${body.rollingSummary.trim()}`
    : "Resumen acumulado: (vacío — puedes iniciar o anclar escena según la acción.)";

  const disrupt = body.synapticDisruption?.trim();

  const chunks: string[] = [
    summaryBlock,
    "═══ GÉNESIS DE CRÓNICA (persistente — ancla escenas) ═══\n" + formatChronicleForPrompt(body.chronicle),
    `Amenaza Inquisitorial (escala 0–5 en mesa): ${body.inquisitionThreat}`,
  ];
  if (disrupt) {
    chunks.push(
      "═══ DISRUPCIÓN SINÁPTICA (PRIORIDAD ABSOLUTA — integra antes que cualquier otro arco) ═══\n" + disrupt,
    );
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
- Si aparece "DISRUPCIÓN SINÁPTICA", integra ese elemento de forma orgánica y prioritaria en la narración actual aunque contradiga parcialmente el plan previo (sin romper la coherencia física básica salvo que la disrupción lo exija).
- Si hay "Directivas del MJ", obedécelas salvo que choquen con una Disrupción Sináptica activa (en ese caso la disrupción gana).
- La salida debe ser SIEMPRE un JSON con las claves "narracion" (texto de respuesta al jugador, segunda persona o estilo escena) y "resumen_actualizado" (máximo ~350 caracteres: qué quedó establecido en la escena para turnos futuros).
- "narracion": 1–4 párrafos breves, ritmo diegético, sin rodapiés meta salvo que el canal lo requiera.
- No otorgues éxitos automáticos en reglas: puedes describir tensiones y pedir tiradas al MJ si hace falta, sin números inventados concretos salvo que la mesa los haya declarado.`;

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY no está definida. Añade la clave en .env.local y reinicia el servidor.",
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

  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
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

  const userPrompt = buildUserPrompt(body);

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });
    const raw = result.response.text().trim();
    if (!raw) {
      return NextResponse.json(
        { error: "El modelo no devolvió texto (posible bloqueo de seguridad)." },
        { status: 422 },
      );
    }

    let parsed: { narracion?: string; resumen_actualizado?: string };
    try {
      parsed = JSON.parse(raw) as { narracion?: string; resumen_actualizado?: string };
    } catch {
      return NextResponse.json(
        { error: "No se pudo parsear JSON del modelo.", raw },
        { status: 502 },
      );
    }

    const narration = typeof parsed.narracion === "string" ? parsed.narracion.trim() : "";
    if (!narration) {
      return NextResponse.json({ error: "narracion vacía.", raw }, { status: 502 });
    }

    const rolling =
      typeof parsed.resumen_actualizado === "string"
        ? parsed.resumen_actualizado.trim().slice(0, 2000)
        : "";

    return NextResponse.json({
      narration,
      rollingSummary: rolling || undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/narrador]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
