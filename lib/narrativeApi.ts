/**
 * Placeholder Cronista de las Sombras: cuando exista servidor, integrar aquí la llamada HTTP o al LLM.
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
    "Este servicio debería recibir la acción del jugador y el estado de la sala y devolver una continuación narrativa segura para Vampire: The Masquerade."
  );
}
