import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
} from "@google/generative-ai";

import { resolveGeminiApiKey } from "@/lib/geminiEnv";
import { isQuotaOrRateLimitError, resolveGeminiModels, withExponentialBackoff } from "@/lib/geminiRetry";

import { NARRADOR_SYSTEM_INSTRUCTION } from "./prompts";

export async function generateNarradorWithGemini(userPrompt: string): Promise<{
  narracion: string;
  resumen_actualizado?: string;
  sugerencias?: string[];
}> {
  const key = resolveGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY no configurada.");
  }
  const genAI = new GoogleGenerativeAI(key);
  const { primary, fallback } = resolveGeminiModels();

  try {
    try {
      return await withExponentialBackoff(
        () => generateNarradorJson(genAI, primary, userPrompt),
        { maxAttempts: 2, baseDelayMs: 1200, label: primary, capWaitMs: 10_000 },
      );
    } catch (e1) {
      if (!isQuotaOrRateLimitError(e1) || primary === fallback) throw e1;
      console.warn("[geminiNarrador] fallback modelo →", fallback);
      return await withExponentialBackoff(
        () => generateNarradorJson(genAI, fallback, userPrompt),
        { maxAttempts: 2, baseDelayMs: 1200, label: fallback, capWaitMs: 10_000 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(msg);
  }
}

function getNarradorModel(genAI: GoogleGenerativeAI, modelName: string) {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: NARRADOR_SYSTEM_INSTRUCTION,
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
            description: "Continuación narrativa inmersiva para el jugador (1–4 párrafos cortos).",
          },
          resumen_actualizado: {
            type: SchemaType.STRING,
            description: "Resumen breve del estado de escena para coherencia (≤300 caracteres).",
          },
          sugerencias: {
            type: SchemaType.ARRAY,
            description: "Exactamente tres líneas: posibles siguientes movimientos para el jugador (≤120 caracteres cada una).",
            items: { type: SchemaType.STRING },
          },
        },
        required: ["narracion", "resumen_actualizado", "sugerencias"],
      },
    },
  });
}

async function generateNarradorJson(
  genAI: GoogleGenerativeAI,
  modelName: string,
  userPrompt: string,
): Promise<{ narracion: string; resumen_actualizado?: string; sugerencias?: string[] }> {
  const model = getNarradorModel(genAI, modelName);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  });
  const raw = result.response.text().trim();
  if (!raw) {
    throw new Error("El modelo no devolvió texto (posible bloqueo de seguridad).");
  }
  let parsed: { narracion?: string; resumen_actualizado?: string; sugerencias?: unknown };
  try {
    parsed = JSON.parse(raw) as { narracion?: string; resumen_actualizado?: string; sugerencias?: unknown };
  } catch {
    throw new Error("No se pudo parsear JSON del modelo.");
  }
  const narration = typeof parsed.narracion === "string" ? parsed.narracion.trim() : "";
  if (!narration) {
    throw new Error("narracion vacía.");
  }
  const rawSug = parsed.sugerencias;
  const sugerencias =
    Array.isArray(rawSug)
      ? rawSug.map((x) => (typeof x === "string" ? x.trim().slice(0, 160) : "")).filter(Boolean).slice(0, 4)
      : undefined;

  return {
    narracion: narration,
    resumen_actualizado:
      typeof parsed.resumen_actualizado === "string" ? parsed.resumen_actualizado.trim().slice(0, 2000) : undefined,
    sugerencias: sugerencias?.length ? sugerencias : undefined,
  };
}
