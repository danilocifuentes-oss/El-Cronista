import type { CharacterSheet } from "@/lib/character";
import { CLAN_OPTIONS } from "@/lib/character";

/** Contexto compacto para el narrador IA (no sustituye la hoja completa en mesa). */
export function buildSheetSummary(sheet: CharacterSheet): string {
  const clanLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;
  const topSkills = Object.entries(sheet.skills)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 8)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
  const topDisc = Object.entries(sheet.disciplines)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 5)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  const lines = [
    `Nombre: ${sheet.name?.trim() || "—"}`,
    `Linaje: ${clanLabel}${sheet.antitribu ? " (antitribu)" : ""}`,
    `Concepto: ${sheet.concept?.trim() || "—"}`,
    sheet.transfondo?.trim()
      ? `Transfondo (historia / vínculos / secretos jugables): ${sheet.transfondo.trim()}`
      : null,
    `Generación (mes): ${sheet.generation}`,
    `No-vida (años): ${sheet.yearsUnlife}`,
    `Hambre Σ: ${sheet.hunger}/5`,
    `Humanidad: ${sheet.humanity}`,
    `Daño a salud (marcas): ${sheet.healthDamage}`,
    `Voluntad: ${sheet.willpowerCur}/${sheet.willpowerMax}`,
    `Potencia de sangre: ${sheet.bloodPotency}`,
    `Resonancia: ${sheet.resonance?.trim() || "—"}`,
    topSkills ? `Habilidades destacadas: ${topSkills}` : null,
    topDisc ? `Disciplinas: ${topDisc}` : null,
  ];
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

/** Resumen más corto para peticiones API (menos tokens). */
export function buildSheetSummaryLite(sheet: CharacterSheet): string {
  const full = buildSheetSummary(sheet);
  const max = 3800;
  if (full.length <= max) return full;
  return `${full.slice(0, max)}\n[…CV_compacto_NEXO]`;
}
