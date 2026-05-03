/** Tiradas V5 de pool cliente (PROYECTO_SERENO). */

export interface DieRoll {
  face: number;
  hunger: boolean;
}

export type PlayerOutcomeLabel = "ÉXITO" | "FRACASO" | "CONSECUENCIAS DE LA BESTIA";

export function outcomeCode(o: PlayerOutcomeLabel): "[ÉXITO]" | "[FRACASO]" | "[BESTIA]" {
  if (o === "ÉXITO") return "[ÉXITO]";
  if (o === "FRACASO") return "[FRACASO]";
  return "[BESTIA]";
}

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

/** Resumen estilo línea de log — discriminación N/H + marcas opcionales. */
export function summarizeRollNarrator(r: V5RollResult): string {
  const marks = [
    r.criticalNormal ? "[CRIT:N]" : "",
    r.messyCritical ? "[CRIT:CAOS]" : "",
    r.fracasoBestial ? "[F:BEST]" : "",
  ].filter(Boolean);
  const nm = marks.length ? `${marks.join("")} ` : "";
  return `[TRACE:N:${r.normalDice.join("|") || "∅"}│H:${r.hungerDice.join("|") || "∅"}] XS:${r.successes}/${r.difficulty} ${nm}${outcomeCode(r.outcome)}`.trimEnd();
}

/** Tirada serializable para POST `/api/cronista` (sin referencias circulares). */
export type SerializedV5Roll = {
  successes: number;
  difficulty: number;
  passed: boolean;
  margin: number;
  criticalNormal: boolean;
  messyCritical: boolean;
  fracasoBestial: boolean;
  outcome: PlayerOutcomeLabel;
  traceNormal: number[];
  traceHunger: number[];
};

export function serializeV5Roll(r: V5RollResult): SerializedV5Roll {
  return {
    successes: r.successes,
    difficulty: r.difficulty,
    passed: r.passed,
    margin: r.margin,
    criticalNormal: r.criticalNormal,
    messyCritical: r.messyCritical,
    fracasoBestial: r.fracasoBestial,
    outcome: r.outcome,
    traceNormal: [...r.normalDice],
    traceHunger: [...r.hungerDice],
  };
}
