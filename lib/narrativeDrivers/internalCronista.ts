import { CLAN_OPTIONS, type ClanId } from "@/lib/character";
import type { SerializedV5Roll } from "@/lib/dice";
import { STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";

function clanLabel(id: ClanId | string): string {
  return CLAN_OPTIONS.find((c) => c.id === id)?.label ?? String(id);
}

export function generateInternalCronista(opts: {
  tirada: SerializedV5Roll;
  hambre: number;
  input: string;
  narrativeStrand: NarrativeStrand;
  sheetName: string;
  clan: ClanId | string;
  synapticDisruption?: string;
}): string {
  const { tirada, hambre, input, narrativeStrand, sheetName, clan, synapticDisruption } = opts;
  const clanNice = clanLabel(clan);
  const strand = STRAND_LABEL[narrativeStrand];

  let outcomeLine: string;
  if (tirada.fracasoBestial) {
    outcomeLine =
      "La Bestia arrastra el resultado: lo que creías controlado se vuelve rumor en arterias y destello rojo en el rabillo del ojo.";
  } else if (tirada.messyCritical) {
    outcomeLine =
      "Éxito cruel: lo que logras pagado en sangre ajena o vergüenza pública — la ciudad lo registra antes que tú.";
  } else if (tirada.passed && tirada.criticalNormal) {
    outcomeLine =
      "Golpe limpio: la escena cede donde la empujas; el tiempo se inclina a tu favor un segundo de más.";
  } else if (tirada.passed) {
    outcomeLine =
      `Marca suficiente (${tirada.successes} éxitos vs DF ${tirada.difficulty}): la consecuencia narrativa queda sellada sin fisuras obvias.`;
  } else {
    outcomeLine =
      `La tirada no alcanza la dificultad: quedas expuesto/a en el espacio entre lo intentado y lo permitido (margen ${tirada.margin}).`;
  }

  const hungerLine =
    hambre >= 5
      ? "Hambre Σ al máximo: cada textura huele a cobre; la autopista del instinto está despejada."
      : hambre >= 3
        ? "La Sangre aprieta el pulso del gesto; control — sí, pero caro."
        : "La Sangre murmura sin mandar — todavía eres tú quien firma el gesto.";

  const intentEcho =
    input.trim().slice(0, 400) ||
    "Sin intención explícita: el Cronista interno deduce solo desde la tirada y el ancla urbano.";

  const disrupt = synapticDisruption?.trim()
    ? `\n\nPrioridad: ${synapticDisruption.trim().slice(0, 900)}`
    : "";

  return [
    `═══ Motor interno · ${strand} ═══`,
    `${sheetName || "Sujeto"} · ${clanNice}`,
    "",
    outcomeLine,
    hungerLine,
    "",
    `Eco de intención: ${intentEcho}`,
    disrupt,
    "",
    "El Nexo registra la escena — hasta que otro motor la sobrescriba con carne y diálogo.",
  ]
    .join("\n")
    .trim();
}
