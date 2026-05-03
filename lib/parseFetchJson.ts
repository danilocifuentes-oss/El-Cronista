/**
 * Parsea JSON desde Response sin lanzar SyntaxError si el cuerpo es HTML/texto
 * (p. ej. página de error de Vercel: "An error occurred...").
 */
export async function parseFetchJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`Respuesta vacía del servidor (HTTP ${res.status}).`);
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const preview = trimmed.slice(0, 240).replace(/\s+/g, " ");
    throw new Error(
      `El servidor no devolvió JSON (${res.status}). Suele ser fallo de despliegue, timeout o proxy. Inicio de respuesta: ${preview}`,
    );
  }
}
