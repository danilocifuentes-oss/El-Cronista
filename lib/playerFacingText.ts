/**
 * Elimina basura meta que a veces escapan modelos (hilos, etiquetas de modo, etc.).
 * No reescribe buen texto; sólo depura prefijos conocidos.
 */
export function sanitizePlayerFacingNarration(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => {
    let L = line.trimStart();
    L = L.replace(
      /^\[\s*(?:principal|paralela|vivo|nexo|narrador|jugador|sistema)\s*\]\s*[:\-–—.]?\s*/i,
      "",
    );
    L = L.replace(/^cr[oó]nica\s+(?:principal|com[uú]n|compartida)\s*[:\-–—]\s*/i, "");
    L = L.replace(/^modo\s+(?:nexo|campa(?:ñ|n)a\s+solitaria|mesa)[^:\n]{0,40}[:\-–—]\s*/i, "");
    L = L.replace(/^el\s+tablero\s+compartido\s+[^\n]+$/i, "");
    return L.trimEnd();
  });

  const joined = lines.join("\n").trim();
  return joined.replace(/^[\s:;\-–—.]+/, "").trim();
}

export function sanitizeSuggestionLine(text: string): string {
  return sanitizePlayerFacingNarration(text).replace(/^["«]+|["»]+$/g, "").trim();
}
