import { requireOpenAiClient } from "@/lib/openAiClient";

import { openAiModel } from "./config";
import { CRONISTA_SYSTEM } from "./prompts";

/** JSON único con { narracion }. */
export async function jsonCronistaOpenAi(userPrompt: string): Promise<string> {
  const openai = requireOpenAiClient();
  const system = [
    CRONISTA_SYSTEM,
    "",
    'Devuelve un único objeto JSON con la clave "narracion" (string). Sin markdown.',
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: openAiModel(),
    temperature: 0.84,
    max_tokens: 1536,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI cronista vacío.");
  return content;
}

/** Stream en texto plano UTF-8 (compatible con el cliente Nexo). */
export async function streamCronistaOpenAiReadable(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const openai = requireOpenAiClient();
  const system = [
    CRONISTA_SYSTEM,
    "",
    "Responde en texto plano continuo, sin JSON. Tono Cronista, 2–4 párrafos breves salvo que el contexto pida más.",
  ].join("\n");

  const stream = await openai.chat.completions.create({
    model: openAiModel(),
    temperature: 0.84,
    max_tokens: 1536,
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const t = chunk.choices[0]?.delta?.content;
          if (t) controller.enqueue(encoder.encode(t));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
