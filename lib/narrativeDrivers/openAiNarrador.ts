import { openAiModel } from "./config";
import { NARRADOR_SYSTEM_INSTRUCTION } from "./prompts";

type JsonOut = { narracion?: string; resumen_actualizado?: string };

export async function generateNarradorWithOpenAi(userPrompt: string): Promise<{
  narracion: string;
  resumen_actualizado?: string;
}> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY no configurada.");
  }

  const system = [
    NARRADOR_SYSTEM_INSTRUCTION,
    "",
    "Formato: un único objeto JSON con narracion y resumen_actualizado. Sin markdown fuera del JSON.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: openAiModel(),
      temperature: 0.88,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI narrador HTTP ${res.status}: ${rawText.slice(0, 400)}`);
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>;
  };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    throw new Error("Respuesta OpenAI no es JSON.");
  }

  const content = data.choices?.[0]?.message?.content?.trim();
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

  return {
    narracion,
    resumen_actualizado:
      typeof parsed.resumen_actualizado === "string" ? parsed.resumen_actualizado.trim().slice(0, 2000) : undefined,
  };
}
