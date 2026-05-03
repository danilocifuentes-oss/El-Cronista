import { CLAN_OPTIONS, type ClanId } from "@/lib/character";
import type { SerializedV5Roll } from "@/lib/dice";
import type { NarrativeStrand } from "@/lib/narrativeStrands";

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
  const { tirada, hambre, input, sheetName, clan, synapticDisruption } = opts;
  const clanNice = clanLabel(clan);

  let outcomeLine: string;
  if (tirada.fracasoBestial) {
    outcomeLine =
      "La Bestia arrastra el resultado: lo que creías controlado se vuelve rumor en arterias y un destello rojo en el rabillo del ojo.";
  } else if (tirada.messyCritical) {
    outcomeLine =
      "Éxito cruel: lo que logras viene pagado en sangre ajena o en vergüenza pública; la ciudad lo registra antes que tú.";
  } else if (tirada.passed && tirada.criticalNormal) {
    outcomeLine =
      "Golpe limpio: la escena cede donde la empujas; el tiempo se inclina un segundo más a tu favor.";
  } else if (tirada.passed) {
    outcomeLine =
      `Te alcanza la marca suficiente (${tirada.successes} éxitos frente a dificultad ${tirada.difficulty}); la consecuencia queda sellada sin fisuras evidentes.`;
  } else {
    outcomeLine = `La tirada no alcanza: te quedás en el hueco entre el gesto y lo permitido (margen ${tirada.margin}).`;
  }

  const hungerLine =
    hambre >= 5
      ? "La sed está al ras: cada superficie huele a cobre y el instinto pide autopista libre."
      : hambre >= 3
        ? "La Sangre aprieta el pulso del gesto; sí, control — pero tiene precio audible."
        : "La Sangre murmura en segundo plano; todavía firmas vos el gesto.";

  const intentEcho =
    input.trim().slice(0, 400) ||
    "La intención llega apenas insinuada: la escena debe leer más en tu cuerpo que en tus palabras.";

  const disrupt = synapticDisruption?.trim()
    ? `\n\nHay un tirón en lo esperado: ${synapticDisruption.trim().slice(0, 900)}`
    : "";

  return [outcomeLine, "", hungerLine, "", `${sheetName || "Tu personaje"} · ${clanNice}`, "", intentEcho.trim(), disrupt]
    .join("\n")
    .trim();
}
