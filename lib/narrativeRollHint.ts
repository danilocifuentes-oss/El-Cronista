import type { NarradorRequestBody, NarradorRollPrompt } from "@/lib/narrativeTypes";

type IntentGuess =
  | "examine"
  | "move"
  | "social"
  | "violence"
  | "flee"
  | "magic"
  | "ambient"
  | "greeting"
  | "survival_probe"
  | "localization";

function classifyIntentRough(action: string): IntentGuess {
  const a = action.toLowerCase();
  if (/^(hola|buenas|hey|saludos|qué tal|que tal)[\s!?.¡¿]*$/i.test(a.trim())) return "greeting";
  if (/\b(hambre|sed|refugio|provision|necesito|busco\s|mapa|ruta)/.test(a)) return "survival_probe";
  if (/\bdónde\b|\bdonde\b|calle|metro|farmacia/.test(a)) return "localization";
  if (/huir|correr|escap|retroced/.test(a)) return "flee";
  if (/dispar|golpe|atac|apuñal|morder/.test(a)) return "violence";
  if (/persuad|mentir|seduc|negoci|pregunt|insinu/.test(a)) return "social";
  if (/investig|mirar|rastrear|hacke|examin|leer|cerradur/.test(a)) return "examine";
  if (/camin|entrar|subir|bajar|ir\b|voy\b|me muevo/.test(a)) return "move";
  if (/disciplina|auspex|celeridad|presencia|dominat|protean/.test(a)) return "magic";
  return "ambient";
}

/** Heurística estable: mismo cuerpo de petición ⇒ misma etiqueta entre drivers (Gemini/OpenAI/interno). */
export function inferRollPrompt(body: NarradorRequestBody): NarradorRollPrompt | undefined {
  const act = body.playerAction.trim();
  const intent = classifyIntentRough(act);

  /** Disrupción operador = consecuencias de alto volumen táctico. */
  const bumpStress = Boolean(body.synapticDisruption?.trim());
  const tenseCity = body.inquisitionThreat >= 4;

  let nivel: NarradorRollPrompt["nivel"] | null = null;
  let enfoque = "";

  if (intent === "violence") {
    nivel = "urgente";
    enfoque = "Físico, reflejos y daño declarado antes de improvisar resultado.";
  } else if (intent === "magic") {
    nivel = "urgente";
    enfoque = "Tu don empuja límites perceptivos o sociales: conviene tirar antes de fijar effectos.";
  } else if (intent === "flee") {
    nivel = "recomendada";
    enfoque = "Atletismo/Furtividad contra el tiempo o contra quien te cierra.";
  } else if (intent === "social") {
    if (/\b(amenaz|presion|chantaj|chantaje|chantaj|extorsion|arma|culo de pistola)\b/i.test(act)) {
      nivel = "recomendada";
      enfoque = "Intimidar o política de cerco: mejor con reserva antes de que la escena sea definitiva.";
    } else if (/\b(mentira|engaño|false|engañ)\b/i.test(act)) {
      nivel = "recomendada";
      enfoque = "Subterfugio o persuasión: el resultado no debería quedar garantizado.";
    } else {
      nivel = "opcional";
      enfoque = "Persuadir o llevar etiqueta cuando el margen de la conversación importa.";
    }
  } else if (intent === "examine") {
    const hard = /\b(hacke|violent|caja fuerte|cerradura|alarma|cámara|forense|código)\b/i.test(act);
    nivel = hard ? "recomendada" : "opcional";
    enfoque = hard
      ? "Un acercamiento táctico a sistemas físicos o digitales antes de improvisar claridad absoluta."
      : "Percibir o husmear: tirá si necesitás dato nuevo bajo secreto.";
  } else if (intent === "move" || intent === "localization") {
    nivel = /\b(custodi|custodia|reja|soldad|filtro militar|custodio\b|custodiad)\b/i.test(act)
      ? "recomendada"
      : "opcional";
    enfoque = "Infiltrar o colarse donde hay mirada vigilante antes de declarar entrada limpia.";
  } else if (intent === "survival_probe") {
    nivel = "opcional";
    enfoque = "Recolectar o conseguir bajo vigilancia ciudadana cuando el éxito no es obvio.";
  }

  if (bumpStress && nivel && nivel !== "urgente") {
    nivel = nivel === "opcional" ? "recomendada" : "urgente";
  } else if (bumpStress && !nivel) {
    nivel = "recomendada";
    enfoque = "La escena inyectada pide consecuencias medibles mejor con tirada.";
  }

  if (tenseCity && nivel === "opcional" && /polic|soldad|soldado|custodi|custodia|caza|inqu/i.test(act)) {
    nivel = "recomendada";
  }

  if (!nivel || intent === "greeting") return undefined;
  if (intent === "ambient" && !bumpStress) return undefined;

  return { nivel, enfoque };
}
