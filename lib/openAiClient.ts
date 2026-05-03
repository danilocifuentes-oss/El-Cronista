import OpenAI from "openai";

/** Cliente oficial (solo servidor). Lanza si falta OPENAI_API_KEY. */
export function requireOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada.");
  }
  return new OpenAI({ apiKey });
}

/** Para rutas que pueden omitir OpenAI sin error. */
export function tryOpenAiClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
