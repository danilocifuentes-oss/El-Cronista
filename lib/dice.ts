/** Motor Cainita simplificado — alineado con reglas demo del prompt Mnemósine */

export interface DieRoll {
  face: number;
  hunger: boolean;
}

export type PlayerOutcomeLabel = "ÉXITO" | "FRACASO" | "CONSECUENCIAS DE LA BESTIA";

export interface V5RollResult {
  dice: DieRoll[];
  successes: number;
  difficulty: number;
  passed: boolean;
  margin: number;
  /** ≥2 dados normales muestran 10 */
  criticalNormal: boolean;
  /** Éxito crítico normales + ≥1 diez en rojo */
  messyCritical: boolean;
  fracasoBestial: boolean;
  outcome: PlayerOutcomeLabel;
  normalDice: number[];
  hungerDice: number[];
}

export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/** Primero dados “negros”, luego dados de Hambre (“rojos”) */
export function rollPoolOrdered(pool: number, hungerDice: number): DieRoll[] {
  const p = Math.max(0, pool);
  const h = Math.min(Math.max(0, hungerDice), p);
  const normalCount = p - h;
  const dice: DieRoll[] = [];

  for (let i = 0; i < normalCount; i += 1) {
    dice.push({ face: rollD10(), hunger: false });
  }
  for (let i = 0; i < h; i += 1) {
    dice.push({ face: rollD10(), hunger: true });
  }
  return dice;
}

export function evaluatePoolV5(dice: DieRoll[], difficulty: number): V5RollResult {
  const normalDice = dice.filter((d) => !d.hunger).map((d) => d.face);
  const hungerDice = dice.filter((d) => d.hunger).map((d) => d.face);

  let successes = 0;
  let normalTens = 0;
  let hungerTens = 0;

  for (const d of dice) {
    if (d.face === 10) {
      successes += 2;
      if (d.hunger) hungerTens += 1;
      else normalTens += 1;
    } else if (d.face >= 6) {
      successes += 1;
    }
  }

  const criticalNormal = normalTens >= 2;
  if (criticalNormal) successes += 1;

  const passed = successes >= difficulty;
  const messyCritical = criticalNormal && hungerTens >= 1;

  const anyHungerOne = dice.some((d) => d.hunger && d.face === 1);
  const fracasoBestial = anyHungerOne && !passed;

  let outcome: PlayerOutcomeLabel = "FRACASO";
  if (fracasoBestial) outcome = "CONSECUENCIAS DE LA BESTIA";
  else if (passed) outcome = "ÉXITO";

  return {
    dice,
    successes,
    difficulty,
    passed,
    margin: successes - difficulty,
    criticalNormal,
    messyCritical,
    fracasoBestial,
    outcome,
    normalDice,
    hungerDice,
  };
}

export function rollPoolV5(pool: number, hungerDice: number, difficulty: number): V5RollResult {
  const ordered = rollPoolOrdered(pool, hungerDice);
  return evaluatePoolV5(ordered, difficulty);
}

/** Resumen sólo narrador — incluye tirada discriminada por color */
export function summarizeRollNarrator(r: V5RollResult): string {
  const blacks = r.dice
    .map((d, i) => (d.hunger ? null : `[${i + 1}]=${d.face}`))
    .filter(Boolean)
    .join(" ");
  const reds = r.dice
    .map((d, i) => (d.hunger ? `[H${i + 1}]=${d.face}` : null))
    .filter(Boolean)
    .join(" ");
  const extras = [
    r.criticalNormal ? "Éxito crítico (≥2 ×10 negros)" : "",
    r.messyCritical ? "Crítico sucio (10 en sangre durante crítico)" : "",
    r.fracasoBestial ? "Fracaso bestial (1 rojo sin superar DF)" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return `Negros: ${blacks || "—"} | Rojos: ${reds || "—"} · Éxitos ${r.successes}/${r.difficulty} → ${extras || "sin marca especial"}`;
}
