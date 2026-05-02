/**
 * Tirada simplificada V5 (demo):
 * - Dado normal: 6–9 = 1 éxito, 10 = 2 éxitos (crítico).
 * - Dado de Hambre: igual; 10 = crítico "desordenado" (messy flag); 1 + 0 éxitos = fallo bestial plausible.
 */

export interface DieRoll {
  face: number;
  hunger: boolean;
}

export interface V5RollResult {
  dice: DieRoll[];
  successes: number;
  difficulty: number;
  margin: number;
  /** Dos o más dados mostraron 10 (crítico en narrativa demo) */
  critical: boolean;
  messyCritical: boolean;
  beastialFail: boolean;
}

export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/** pool: número total de dados; hungerDice: cuántos (desde la “derecha” del grupo) son de Hambre */
export function rollPoolV5(pool: number, hungerDice: number, difficulty: number): V5RollResult {
  const p = Math.max(0, pool);
  const h = Math.min(Math.max(0, hungerDice), p);
  const dice: DieRoll[] = [];

  for (let i = 0; i < p; i += 1) {
    const hunger = i >= p - h;
    dice.push({ face: rollD10(), hunger });
  }

  let successes = 0;
  let tens = 0;
  let messyCritical = false;
  let beastialFail = false;

  for (const d of dice) {
    if (d.face === 10) {
      successes += 2;
      tens += 1;
      if (d.hunger) messyCritical = true;
    } else if (d.face >= 6) {
      successes += 1;
    } else if (d.face === 1 && d.hunger) {
      /* marcamos posibilidad narrativa si no hay éxitos al final */
    }
  }

  const critical = tens >= 2;
  successes += critical ? 1 : 0;

  const anySuccess = successes > 0;
  beastialFail = dice.some((d) => d.hunger && d.face === 1) && !anySuccess;

  return {
    dice,
    successes,
    difficulty,
    margin: successes - difficulty,
    critical,
    messyCritical: messyCritical && tens >= 1,
    beastialFail,
  };
}

export function summarizeRoll(r: V5RollResult): string {
  const parts = [
    `Éxitos: ${r.successes} vs DF ${r.difficulty} (${r.margin >= 0 ? "superado" : "fallido"})`,
    r.critical ? "Crítico" : "",
    r.messyCritical ? "| Crítico desordenado (Hambre)" : "",
    r.beastialFail ? "| Fallo bestial latente (1 en dado de Hambre, sin éxitos)" : "",
  ].filter(Boolean);
  return parts.join(" ");
}
