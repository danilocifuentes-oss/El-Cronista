import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { resolveGeminiApiKey } from "@/lib/geminiEnv";
import { resolveGeminiModels, withExponentialBackoff } from "@/lib/geminiRetry";

export const runtime = "nodejs";
export const maxDuration = 45;

const FALLBACK_LINES = [
  "Niebla densa en el cordón: visibilidad reducida; Percepción afectada en exteriores.",
  "Se busca guardia nocturno — bodega Quilicura. Pago en efectivo. Sin preguntas.",
  "Apagón parcial: Providencia. Autobuses con desvíos nocturnos.",
  "Desapariciones en Metro: rumor de patrullas no registradas tras medianoche.",
];

function parseLines(text: string): string[] {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => (typeof x === "string" ? x.trim().slice(0, 160) : ""))
        .filter(Boolean)
        .slice(0, 6);
    }
  } catch {
    /* seguir */
  }
  return FALLBACK_LINES;
}

export async function POST(req: Request) {
  let hint = "";
  try {
    const body = (await req.json()) as { ciudad?: unknown };
    if (typeof body.ciudad === "string") hint = body.ciudad.slice(0, 120);
  } catch {
    hint = "";
  }

  const key = resolveGeminiApiKey();
  if (!key) {
    return NextResponse.json({ lines: FALLBACK_LINES });
  }

  const prompt = [
    "Santiago de Chile, tono Mundo de Tinieblas / ciudad gótica contemporánea.",
    "Devuelve SOLO un JSON array de exactamente 4 strings en español (Chile).",
    "Cada string ≤ 120 caracteres: una mezcla de:",
    "— estado del tiempo anómalo con eco mecánico (¿penaliza Percepción?);",
    "— publicidad cifrada / aviso sospechoso (gancho de misión);",
    "— rumor urbano o breve noticia radio/página;",
    "— detalle de infraestructura (metro, luz, lluvia ácida trivial).",
    hint ? `Contexto opcional ciudad/barrio: ${hint}` : "",
    "Sin markdown, sin comillas escapadas raras; solo el array JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const ai = new GoogleGenerativeAI(key);
    const { primary, fallback } = resolveGeminiModels();

    let raw: string;
    try {
      raw = await withExponentialBackoff(
        async () => {
          const model = ai.getGenerativeModel({ model: primary });
          const out = await model.generateContent(prompt);
          return out.response.text();
        },
        { maxAttempts: 2, baseDelayMs: 900, label: "pulso-mundo-primary", capWaitMs: 8000 },
      );
    } catch {
      raw = await withExponentialBackoff(
        async () => {
          const model = ai.getGenerativeModel({ model: fallback });
          const out = await model.generateContent(prompt);
          return out.response.text();
        },
        { maxAttempts: 2, baseDelayMs: 900, label: "pulso-mundo-fallback", capWaitMs: 8000 },
      );
    }

    const lines = parseLines(raw);
    if (lines.length >= 2) {
      return NextResponse.json({ lines });
    }
  } catch {
    /* JSON fallback */
  }

  return NextResponse.json({ lines: FALLBACK_LINES });
}
