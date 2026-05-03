import { normalizeStrand, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

type Intent = "examine" | "move" | "social" | "violence" | "flee" | "magic" | "ambient";

function classifyIntent(action: string): Intent {
  const a = action.toLowerCase();
  if (/huir|correr|escap|retroced|salir pitando|arrancar/.test(a)) return "flee";
  if (/dispar|golpe|atac|apuñal|morder|arrancar (?!de)/.test(a)) return "violence";
  if (/persuad|hablar|mentir|seduc|negoci|pregunt|decir|insinu|llamar/.test(a)) return "social";
  if (/investig|buscar|mirar|oir|oler|rastrear|hacke|examin|leer/.test(a)) return "examine";
  if (/camin|entrar|subir|bajar|cruzar|ir |voy |dirig/.test(a)) return "move";
  if (/disciplina|auspex|celeridad|presencia|dominat|protean|barbarie/.test(a)) return "magic";
  return "ambient";
}

function threatTone(n: number): string {
  if (n >= 4) return "El telón urbano parece más delgado: sombras con intención.";
  if (n >= 2) return "La ciudad te devuelve una mirada fría, calculadora.";
  return "La noche sigue su ritmo; el peligro es rumor, no certeza.";
}

function strandFlavor(strand: NarrativeStrand): string {
  if (strand === "paralela") {
    return "Este hilo es tu incursión lateral: detalle íntimo o contacto, sin forzar el arco principal.";
  }
  if (strand === "vivo") {
    return "Continuidad de mesa física: presente, táctil, sin florituras de terminal.";
  }
  return "Crónica principal: lo que ocurre en el tablero compartido de la ciudad.";
}

export function generateInternalNarrador(body: NarradorRequestBody): {
  narracion: string;
  resumen_actualizado?: string;
} {
  const strand: NarrativeStrand = normalizeStrand(body.narrativeStrand);
  const intent = classifyIntent(body.playerAction);
  const disrupt = body.synapticDisruption?.trim();

  const openers: Record<Intent, string> = {
    examine:
      "Afirmas el gesto y el espacio te devuelve datos incompletos: polvo, silencio comprado, una ausencia demasiado ordenada.",
    move: "El paso te redefine el mapa. Santiago no juzga; solo acorta distancias hasta el siguiente conflicto.",
    social:
      "Las palabras miden el aire entre ustedes. Lo que no se dice queda archivado en la temperatura de la habitación.",
    violence:
      "El cuerpo recuerda antes que la mente: impacto, roce, el metal de la ciudad filtrándose en la escena.",
    flee:
      "Prioridad de salida: el entorno se abre en cortes, rutas, reflejos en vidrio que no te pertenecen.",
    magic:
      "El don estira la escena hacia un registro indebido: sombras con memoria, tiempo que tropieza.",
    ambient:
      "El Cronista interno ancla el gesto en la calle: niebla de escape, neón que no ilumina, radio apagada.",
  };

  const mid: Record<Intent, string> = {
    examine:
      "Si hay ojos que no deberían estar, los detectas como latencia: un retardo entre lo que ves y lo que te conviene creer.",
    move: "Cada esquina podría ser continuidad o trampa; eliges con el peso del silencio en la nuca.",
    social: "La máscara social sostiene la escena; debajo, la Bestia asiente sin votar.",
    violence: "La mesa ya dictó legalidad o caos; aquí solo queda el eco metálico de las consecuencias.",
    flee: "El refugio es provisional; la ciudad anota tu trayectoria como quien anota deudas.",
    magic: "El poder deja olor a ozono y reglas rotas; quien observa sin saber, llama a otros observadores.",
    ambient:
      "Lo cotidiano se inclina: una tubería suena demasiado fuerte, un pasillo demasiado largo.",
  };

  const disruptBlock = disrupt
    ? `\n\nDisrupción sináptica activa: ${disrupt.slice(0, 900)}`
    : "";

  const narracion = [
    `[${STRAND_LABEL[strand]}]`,
    strandFlavor(strand),
    "",
    openers[intent],
    mid[intent],
    "",
    threatTone(body.inquisitionThreat),
    `Eco de la acción: ${clip(body.playerAction, 520)}`,
    disruptBlock,
  ]
    .join("\n")
    .trim();

  const resumen_actualizado = clip(
    `${STRAND_LABEL[strand]} · ${intent}: ${clip(body.playerAction, 120)} · σ${body.inquisitionThreat}`,
    340,
  );

  return { narracion, resumen_actualizado };
}
