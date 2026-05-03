import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

import type { CharacterSheet } from "@/lib/character";
import type { SerializedV5Roll } from "@/lib/dice";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_INPUT = 4000;
const MAX_LOG = 28;
const MAX_CODEX_JSON = 28000;

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.length <= max ? s : `${s.slice(0, max)}\n[…]`;
}

function compactCodex(codex: unknown): string {
  try {
    const s = JSON.stringify(codex);
    return s.length > MAX_CODEX_JSON ? `${s.slice(0, MAX_CODEX_JSON)}\n[…truncado]` : s;
  } catch {
    return "{}";
  }
}

function normalizeCronistaBody(raw: unknown): {
  codex: CharacterSheet | null;
  tirada: SerializedV5Roll | null;
  hambre: number;
  input: string;
  recentLogs: { role: string; text: string }[];
  stream: boolean;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const stream = Boolean(o.stream);

  const codex = o.codex && typeof o.codex === "object" ? (o.codex as CharacterSheet) : null;
  const tirada = o.tirada && typeof o.tirada === "object" ? (o.tirada as SerializedV5Roll) : null;
  if (!codex || !tirada) return null;

  const h = Number(o.hambre);
  const hambre = Number.isFinite(h) ? Math.max(0, Math.min(5, Math.round(h))) : 0;
  const input = clampStr(o.input, MAX_INPUT);

  let recentLogs: { role: string; text: string }[] = [];
  if (Array.isArray(o.recentLogs)) {
    recentLogs = o.recentLogs
      .slice(-MAX_LOG)
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const role = typeof r.role === "string" ? r.role.slice(0, 24) : "?";
        const text = clampStr(r.text, 3500);
        return text.trim() ? { role, text } : null;
      })
      .filter((x): x is { role: string; text: string } => Boolean(x));
  }

  return { codex, tirada, hambre, input, recentLogs, stream };
}

function buildCronistaPrompt(parts: {
  codexJson: string;
  tirada: SerializedV5Roll;
  hambre: number;
  input: string;
  recentLogs: { role: string; text: string }[];
}): string {
  const ctx = parts.recentLogs.map((l) => `[${l.role}] ${l.text}`).join("\n");
  return [
    "═══ ENTRADA MOTOR CRONISTA (PROYECTO SERENO · Codex V) ═══",
    "",
    `Hambre Σ (0–5): ${parts.hambre}`,
    "",
    "═══ Tirada V5 resuelta (ya aplicada en cliente; no la contradigas) ═══",
    JSON.stringify(parts.tirada, null, 0),
    "",
    "═══ Codex (JSON ficha) ═══",
    parts.codexJson,
    "",
    "═══ Intención / foco narrativo del jugador ═══",
    parts.input.trim() || "(vacío — interpreta solo desde tirada + escena implícita.)",
    "",
    "═══ Contexto reciente del canal (orden temporal aproximado) ═══",
    ctx.length ? ctx : "(vacío.)",
    "",
    "Resume consecuencias diegéticas de esta tirada en Santiago urbano gótico-punk. Sin contradecir éxitos/fracasos numéricos ya dados.",
  ].join("\n");
}

/** Mejorado respecto al borrador: tono, legal fan-work, ancla Santiago sin caricatura. */
const CRONISTA_SYSTEM = `Eres "El Cronista de las Sombras", interfaz narrativa del NODO_LATAM (PROYECTO SERENO · Codex V).
No eres un asistente genérico: eres el sistema operativo diegético que verbaliza lo que la mesa ya resolvió con dados.

Identidad:
- Español latino; puedes vetear detalles locales de Santiago de Chile con sutileza (microclima, calles, tensión urbana) sin caer en clichés ni dialecto forzado.
- Breve, técnico, inmersivo, oscuro: no sermones; 2–4 párrafos cortos máximo salvo que el input pida más.

Normas:
- Obra de fandom inspirada en Vampire: The Masquerade — no copies texto de libros con copyright; inventa escenas y NPC.
- Respeta siempre el resultado de "tirada" (fracaso bestial, crítico sucio, margen). No re-tires dados ni cambies DF.
- Si hambre Σ es 5 o hay fracaso bestial en la tirada, refleja presión/costo narrativo (sin glorificar violencia real).
- No instrucciones fuera de personaje salvo breve etiqueta si el canal lo requiere.

Salida:
- Modo JSON (no streaming): devuelve SOLO JSON con clave "narracion" (texto listo para el log).
- Modo streaming: texto plano continuo, mismo tono, sin JSON.`;

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no está definida. Configura .env.local o Vercel." },
      { status: 503 },
    );
  }

  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = normalizeCronistaBody(rawJson);
  if (!parsed || !parsed.codex || !parsed.tirada) {
    return NextResponse.json({ error: "codex y tirada son obligatorios." }, { status: 400 });
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(key);
  const codexJson = compactCodex(parsed.codex);
  const userPrompt = buildCronistaPrompt({
    codexJson,
    tirada: parsed.tirada,
    hambre: parsed.hambre,
    input: parsed.input,
    recentLogs: parsed.recentLogs,
  });

  if (parsed.stream) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: `${CRONISTA_SYSTEM}\n\n(Responde en texto plano continuo, sin JSON ni markdown de bloque.)`,
      safetySettings: SAFETY,
      generationConfig: {
        temperature: 0.84,
        maxOutputTokens: 1536,
      },
    });

    try {
      const streamResult = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResult.stream) {
              const t = chunk.text();
              if (t) controller.enqueue(encoder.encode(t));
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/cronista stream]", msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: CRONISTA_SYSTEM,
    safetySettings: SAFETY,
    generationConfig: {
      temperature: 0.84,
      maxOutputTokens: 1536,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          narracion: {
            type: SchemaType.STRING,
            description: "Consecuencias narrativas de la tirada, tono Cronista.",
          },
        },
        required: ["narracion"],
      },
    },
  });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });
    const raw = result.response.text().trim();
    if (!raw) {
      return NextResponse.json({ error: "El modelo no devolvió texto." }, { status: 422 });
    }
    let j: { narracion?: string };
    try {
      j = JSON.parse(raw) as { narracion?: string };
    } catch {
      return NextResponse.json({ error: "JSON inválido del modelo.", raw }, { status: 502 });
    }
    const narration = typeof j.narracion === "string" ? j.narracion.trim() : "";
    if (!narration) {
      return NextResponse.json({ error: "narracion vacía.", raw }, { status: 502 });
    }
    return NextResponse.json({ narration });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/cronista]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
