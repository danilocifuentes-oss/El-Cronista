import { requireOpenAiClient } from "@/lib/openAiClient";

import { openAiModel } from "./config";
import { NARRADOR_SYSTEM_INSTRUCTION } from "./prompts";

type JsonOut = {
  narracion?: string;
  resumen_actualizado?: string;
  sugerencias?: unknown;
};

function normalizeSugerencias(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const s = raw.map((x) => (typeof x === "string" ? x.trim().slice(0, 160) : "")).filter(Boolean).slice(0, 4);
  return s.length ? s : undefined;
}

export async function generateNarradorWithOpenAi(userPrompt: string): Promise<{
  narracion: string;
  resumen_actualizado?: string;
  sugerencias?: string[];
}> {
  const openai = requireOpenAiClient();

  const system = [
    NARRADOR_SYSTEM_INSTRUCTION,
    "",
    "Salida: un solo objeto JSON válido; sin fence markdown. Claves exactas: narracion, resumen_actualizado, sugerencias.",
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: openAiModel(),
    temperature: 0.88,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI narrador vacío.");
  }

  let parsed: JsonOut;
  try {
    parsed = JSON.parse(content) as JsonOut;
  } catch {
    throw new Error("OpenAI narrador no devolvió JSON parseable.");
  }

  const narracion = typeof parsed.narracion === "string" ? parsed.narracion.trim() : "";
  if (!narracion) {
    throw new Error("narracion vacía (OpenAI).");
  }

  const sugerencias = normalizeSugerencias(parsed.sugerencias);

  return {
    narracion,
    resumen_actualizado:
      typeof parsed.resumen_actualizado === "string" ? parsed.resumen_actualizado.trim().slice(0, 2000) : undefined,
    sugerencias,
  };
}
