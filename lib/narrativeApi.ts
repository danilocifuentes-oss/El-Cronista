import { parseFetchJson } from "@/lib/parseFetchJson";
import type { NarradorApiResponse, NarradorRequestBody } from "@/lib/narrativeTypes";

/**
 * Llama al narrador Gemini vía `/api/narrador` (clave solo en servidor).
 */
export async function askCronista(body: NarradorRequestBody): Promise<NarradorApiResponse> {
  const res = await fetch("/api/narrador", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseFetchJson<
    NarradorApiResponse & {
      error?: string;
      raw?: string;
      rollPrompt?: { nivel?: string; enfoque?: string };
    }
  >(res);

  if (!res.ok) {
    throw new Error(data.error || `narrador HTTP ${res.status}`);
  }

  if (!data.narration?.trim()) {
    throw new Error(data.error || "Respuesta sin narración.");
  }

  const rp = data.rollPrompt;
  let rollPrompt: NarradorApiResponse["rollPrompt"];
  if (rp && typeof rp === "object" && typeof rp.enfoque === "string") {
    const n = rp.nivel;
    if (n === "opcional" || n === "recomendada" || n === "urgente") {
      rollPrompt = { nivel: n, enfoque: rp.enfoque.trim() };
    }
  }

  const sugRaw =
    Array.isArray(data.suggestions) && data.suggestions.length
      ? data.suggestions
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

  let suggestions = sugRaw;
  if (sugRaw?.length) {
    const seen = new Set<string>();
    suggestions = sugRaw.filter((s) => {
      if (!s.length || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
    if (!suggestions.length) suggestions = undefined;
  }

  return {
    narration: data.narration.trim(),
    rollingSummary: data.rollingSummary?.trim(),
    suggestions,
    ...(rollPrompt ? { rollPrompt } : {}),
  };
}
