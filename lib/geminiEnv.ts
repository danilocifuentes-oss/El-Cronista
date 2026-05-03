/**
 * Resolución única de la clave Gemini para servidor (Next/Vercel).
 *
 * El nombre en Google AI Studio (“Gemini API Key”) es solo etiqueta; aquí cuenta el
 * **nombre de la variable de entorno** en Vercel o .env.local.
 */
const ALIASES = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
] as const;

export function resolveGeminiApiKey(): string | undefined {
  for (const name of ALIASES) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(resolveGeminiApiKey());
}

/** Para diagnósticos (health): qué variable se está usando, sin revelar el valor. */
export function whichGeminiEnvName(): string | null {
  for (const name of ALIASES) {
    if (process.env[name]?.trim()) return name;
  }
  return null;
}
