/**
 * Placeholder Cronista de las Sombras — integrar aquí llamada HTTP / LLM cuando exista backend.
 */

export async function askCronista(
  playerAction: string,
  contextSummary: string,
): Promise<string> {
  void playerAction;
  void contextSummary;
  await new Promise((r) => setTimeout(r, 400));
  return (
    "[MOTOR IA — pendiente]\nLa red SchreckNet no devuelve aún texto del Narrador automatizado.\n" +
    "Este endpoint debe recibir la acción del jugador + estado de sala y producir continuación narrativa segura para V:tM."
  );
}
