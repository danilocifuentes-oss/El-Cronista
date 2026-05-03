import { openAiModel } from "./config";
import { CRONISTA_SYSTEM } from "./prompts";

function apiKey(): string {
  const k = process.env.OPENAI_API_KEY?.trim();
  if (!k) throw new Error("OPENAI_API_KEY no configurada.");
  return k;
}

/** JSON único con { narracion }. */
export async function jsonCronistaOpenAi(userPrompt: string): Promise<string> {
  const system = [
    CRONISTA_SYSTEM,
    "",
    'Devuelve un único objeto JSON con la clave "narracion" (string). Sin markdown.',
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: openAiModel(),
      temperature: 0.84,
      max_tokens: 1536,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI cronista HTTP ${res.status}: ${rawText.slice(0, 400)}`);
  }

  const data = JSON.parse(rawText) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI cronista vacío.");
  return content;
}

/**
 * Devuelve el cuerpo de la respuesta fetch con stream SSE (el caller lee el body).
 */
export async function streamCronistaOpenAiResponse(userPrompt: string): Promise<Response> {
  const system = [
    CRONISTA_SYSTEM,
    "",
    "Responde en texto plano continuo, sin JSON. Tono Cronista, 2–4 párrafos breves salvo que el contexto pida más.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: openAiModel(),
      temperature: 0.84,
      max_tokens: 1536,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI stream HTTP ${res.status}: ${t.slice(0, 400)}`);
  }
  if (!res.body) {
    throw new Error("OpenAI stream sin body.");
  }
  return res;
}
