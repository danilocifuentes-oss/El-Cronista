/**
 * PROYECTO SERENO — validación CODEX V5 (cliente)
 */

import type { ClanId } from "@/lib/character";

export const SERENO_TITLE_FULL = "PROYECTO_SERENO · NODO_LATAM";
export const SERENO_COMM_CHANNEL = "SCHRECK_NET";
export const SERENO_LOGIN_TAGLINE = "CANAL_CIFRADO · tráfico sólo en cliente.";
export const SERENO_DISCLAIMER =
  "Simulación de mesa sin licencia oficial. Vampire / World of Darkness son marcas de sus titulares.";

/** Disciplinas (clave · etiqueta · tooltip 1 línea). */
export const DISCIPLINE_POOL = [
  { key: "animalism", label: "Animalismo", tooltip: "Canalizar vínculos brutos con fauna." },
  { key: "auspex", label: "Auspex", tooltip: "Percepción que atraviesa mentira y materia oculta." },
  {
    key: "blood_sorcery",
    label: "Taumaturgia sangría",
    tooltip: "Rituales dibujados con hemoglobina cargada.",
  },
  { key: "celerity", label: "Celeridad", tooltip: "Cuerpo antes que la luz llegue al ojo ajeno." },
  { key: "dominate", label: "Dominación", tooltip: "Mandar la mente hasta que obedezca en silencio." },
  { key: "fortitude", label: "Fortaleza", tooltip: "Carne endurecida que niega proyectiles obvios." },
  { key: "obfuscate", label: "Ofuscación", tooltip: "Desaparecer entre sombras perceptivas." },
  { key: "potence", label: "Potencia", tooltip: "Fuerza sobrehumana aplicada sin decoro." },
  { key: "presence", label: "Presencia", tooltip: "Aura que encoge o enamora antes del argumento." },
  { key: "protean", label: "Proteán", tooltip: "Descomponer forma en bestia elemental." },
] as const;

export type DisciplineKey = (typeof DISCIPLINE_POOL)[number]["key"];

/** Tres disciplinas por clan según V5 (simplificado). */
export const CLAN_DISCIPLINE_TRIO: Record<ClanId, readonly [DisciplineKey, DisciplineKey, DisciplineKey]> = {
  ventrue: ["dominate", "fortitude", "presence"],
  toreador: ["auspex", "celerity", "presence"],
  brujah: ["celerity", "potence", "presence"],
  malkavian: ["auspex", "dominate", "obfuscate"],
  nosferatu: ["animalism", "obfuscate", "potence"],
  gangrel: ["animalism", "fortitude", "protean"],
  tremere: ["auspex", "blood_sorcery", "dominate"],
  thin_blood: ["blood_sorcery", "auspex", "celerity"],
  caitiff: ["potence", "celerity", "presence"], // placeholders hasta que el usuario elija
  other: ["potence", "celerity", "presence"],
};

export function disciplineLabel(key: string): string {
  return DISCIPLINE_POOL.find((d) => d.key === key)?.label ?? key;
}

export function disciplineTooltip(key: DisciplineKey | string): string {
  return DISCIPLINE_POOL.find((d) => d.key === key)?.tooltip ?? "";
}

export const RESONANCE_OPTIONS = ["Colérica", "Melancólica", "Flemática", "Sanguínea"] as const;

/** Carril tipo ficha clásica (Talento / Técnica / Conocimiento). La validación de puntos sigue siendo V5 Sereno. */
export type SkillLane = "talento" | "tecnica" | "conocimiento";

export const SKILL_LANE_LABEL: Record<SkillLane, string> = {
  talento: "//_TALENTO",
  tecnica: "//_TÉCNICA",
  conocimiento: "//_CONOC",
};

/** Habilidades V5 · etiquetas técnicas ES + tooltip + carril visual. */
export const SERENO_SKILLS = [
  { key: "atletismo", label: "Movimiento", tooltip: "Correr, trepar y sostener carga física.", lane: "tecnica" as const },
  {
    key: "refriegas",
    label: "Combate",
    tooltip: "Violencia cuerpo a cuerpo desarmado o improvisado.",
    lane: "talento" as const,
  },
  { key: "oficios", label: "Oficios", tooltip: "Fabricación y mantenimiento con las manos.", lane: "tecnica" as const },
  { key: "conducir", label: "Propulsión", tooltip: "Vehículos bajo tiempo y dispersión táctica.", lane: "tecnica" as const },
  { key: "armas_fuego", label: "Proyectiles", tooltip: "Líneas de fuego y precisión corta.", lane: "tecnica" as const },
  {
    key: "latrocinio",
    label: "Exfiltración",
    tooltip: "Abrir cerraduras, tomar objetos sin dejar marca.",
    lane: "tecnica" as const,
  },
  {
    key: "combate_cac",
    label: "Contacto armado",
    tooltip: "Armas cortas/contundentes con intención letal.",
    lane: "tecnica" as const,
  },
  { key: "sigilo", label: "Infiltración", tooltip: "Movimiento invisible al ojo medio.", lane: "tecnica" as const },
  { key: "supervivencia", label: "Exterior", tooltip: "Orientación, cobijo y huella en zona hostil.", lane: "tecnica" as const },
  { key: "trato_animales", label: "Fauna", tooltip: "Imponerte o pactar con no humanos vivientes.", lane: "talento" as const },
  { key: "etiqueta", label: "Protocolo", tooltip: "Cadencias de poder en salón y pacto verbal.", lane: "tecnica" as const },
  { key: "perspicacia", label: "Lectura", tooltip: "Captar inconsistencias antes de verbalizarlas.", lane: "talento" as const },
  { key: "intimidacion", label: "Coerción", tooltip: "Doblar comportamiento mediante presión fría.", lane: "talento" as const },
  { key: "liderazgo", label: "Mando", tooltip: "Sincronizar cuerpo ajeno cuando el caos ordena cerrar.", lane: "talento" as const },
  {
    key: "persuasion",
    label: "Ingeniería social",
    tooltip: "Reescribir deseos sin usar cadena física.",
    lane: "talento" as const,
  },
  { key: "callejeo", label: "Geografía urbana", tooltip: "Códigos locales, rutas ilegales, rumores pegados.", lane: "talento" as const },
  {
    key: "subterfugio",
    label: "Disfraz narrativo",
    tooltip: "Construir narrativas falsas y sostenerlas.",
    lane: "talento" as const,
  },
  {
    key: "academicos",
    label: "Corpus textual",
    tooltip: "Humanidades densas aplicadas sobre la marcha.",
    lane: "conocimiento" as const,
  },
  {
    key: "consciencia",
    label: "Periferia",
    tooltip: "Campo sensorial periférico antes de verbalizar amenazas.",
    lane: "talento" as const,
  },
  { key: "finanzas", label: "Flujo capital", tooltip: "Liquidez, extorsión contable y tráfico económico.", lane: "conocimiento" as const },
  {
    key: "investigacion",
    label: "Reconstrucción",
    tooltip: "Escena del crimen y deducción física literal.",
    lane: "conocimiento" as const,
  },
  { key: "medicina", label: "Trauma técnico", tooltip: "Drenar vida o suturar urgencias con precisión.", lane: "conocimiento" as const },
  {
    key: "ocultismo",
    label: "Arcanismo",
    tooltip: "Conocimiento de lo que acecha en la oscuridad.",
    lane: "conocimiento" as const,
  },
  { key: "politica", label: "Estructura poder", tooltip: "Mapear cortes cerradas sin invitación.", lane: "conocimiento" as const },
  { key: "ciencia", label: "Método cerrado", tooltip: "Laboratorio, hipótesis y instrumentación fría.", lane: "conocimiento" as const },
  { key: "tecnologia", label: "Sistemas", tooltip: "Redes, código y electrónica dura.", lane: "conocimiento" as const },
] as const;

export type SerenoSkillKey = (typeof SERENO_SKILLS)[number]["key"];

export const SERENO_SKILL_KEYS = SERENO_SKILLS.map((s) => s.key) as unknown as readonly SerenoSkillKey[];

/** Hint técnico (no UI larga): spread cerrado físico/soc/mental. */
export const ATTRIBUTE_GRID_HINT_ES = "// CODEX físico-soc-mental · cuadratura 4-3³-2³-1 (V5 proyecto).";

export const TOOLTIP_BLOOD_POTENCY = "Índice de sangre cursada usada como canal de poder.";

export const TOOLTIP_RESONANCE = "Firma tonal de la víctima o fuente hematófaga percibida.";

export const TOOLTIP_HUMANITY = "Tensión con la Bestia antes del colapso total.";

export const TOOLTIP_FREEBIE_POOL =
  "Puntos libres (mesa clásica, p. ej. 21). Este cliente no descuenta compras; el MJ/ficha papel liquida el gasto.";

/** Fichas antiguas (inglés) → claves Sereno. */
export const LEGACY_SKILL_ALIASES: Record<string, SerenoSkillKey> = {
  Athletics: "atletismo",
  Stealth: "sigilo",
  Melee: "combate_cac",
  Etiquette: "etiqueta",
  Insight: "perspicacia",
  Intimidation: "intimidacion",
  Occult: "ocultismo",
  Awareness: "consciencia",
  Tecnología: "tecnologia",
  Technology: "tecnologia",
};

export function defaultSerenoSkills(): Record<string, number> {
  return Object.fromEntries(SERENO_SKILLS.map((s) => [s.key, 0]));
}

export function defaultAllDisciplines(): Record<string, number> {
  return Object.fromEntries(DISCIPLINE_POOL.map((d) => [d.key, 0]));
}

export function migrateSkillsFromLegacy(raw: Record<string, number>): Record<string, number> {
  const out = defaultSerenoSkills();
  for (const [k, v] of Object.entries(raw)) {
    const mapped = LEGACY_SKILL_ALIASES[k as keyof typeof LEGACY_SKILL_ALIASES] ?? (k as SerenoSkillKey);
    if (mapped in out) out[mapped] = Math.max(out[mapped] ?? 0, v);
  }
  return out;
}

function countMap(nums: number[]) {
  const m: Record<number, number> = {};
  for (const n of nums) m[n] = (m[n] ?? 0) + 1;
  return m;
}

/** V5 distribución proyectada minimal: 4, 3, 3, 3, 2, 2, 2, 1 + novena estadística ⇒ 1×4, 4×3, 3×2, 1×1. */
export function validateAttributeSpread(attrs: Record<string, number>): string | null {
  const vals = Object.values(attrs);
  if (vals.some((v) => v < 1 || v > 4)) return "!";
  const c = countMap(vals);
  if (c[4] !== 1 || c[3] !== 4 || c[2] !== 3 || c[1] !== 1) return "!";
  return null;
}

export type SkillMode = "jack" | "specialist";

export function validateSkillSpread(skills: Record<string, number>, mode: SkillMode): string | null {
  const vals = SERENO_SKILL_KEYS.map((k) => skills[k] ?? 0);
  if (vals.some((v) => v < 0 || v > 3)) return "!";
  const c = countMap(vals);
  if (mode === "jack") {
    if (c[3] !== 1 || c[2] !== 8 || c[1] !== 10) return "!";
  } else if (c[3] !== 3 || c[2] !== 5 || c[1] !== 7) {
    return "!";
  }
  return null;
}

export type Generation = "neonato" | "ancilla";

export function disciplineBudget(gen: Generation): number {
  return gen === "neonato" ? 2 : 3;
}

export function bloodPotencyForGeneration(gen: Generation): number {
  return gen === "neonato" ? 1 : 2;
}

export function getActiveDisciplineKeys(
  clan: ClanId,
  caitiffPicks: [DisciplineKey, DisciplineKey, DisciplineKey] | null,
): [DisciplineKey, DisciplineKey, DisciplineKey] {
  if (clan === "caitiff" || clan === "other") {
    const t = caitiffPicks ?? CLAN_DISCIPLINE_TRIO[clan];
    return [t[0], t[1], t[2]];
  }
  const t = CLAN_DISCIPLINE_TRIO[clan];
  return [t[0], t[1], t[2]];
}

export function validateDisciplines(
  disciplines: Record<string, number>,
  clan: ClanId,
  gen: Generation,
  caitiffPicks: [DisciplineKey, DisciplineKey, DisciplineKey] | null,
  fusion?: { budget: number; maxPerDot: number },
): string | null {
  const keys = getActiveDisciplineKeys(clan, caitiffPicks);
  const budget = fusion?.budget ?? disciplineBudget(gen);
  const maxPer = fusion?.maxPerDot ?? 2;
  for (const k of Object.keys(disciplines)) {
    const v = disciplines[k] ?? 0;
    if (!keys.includes(k as DisciplineKey) && v > 0) return "!";
  }
  let sum = 0;
  for (const k of keys) {
    const v = disciplines[k] ?? 0;
    if (v < 0 || v > maxPer) return "!";
    sum += v;
  }
  if (sum !== budget) return "!";
  return null;
}

export function skillTooltipForKey(key: string): string | undefined {
  return SERENO_SKILLS.find((s) => s.key === key)?.tooltip;
}
