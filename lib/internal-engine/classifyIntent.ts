/** Intención heurística del turno — estable por texto de acción. */
export type NexoIntent =
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

export function classifyNexoIntent(action: string): NexoIntent {
  const a = action.toLowerCase();
  if (/^(hola|buenas|hey|saludos|qué tal|que tal)[\s!?.¡¿]*$/i.test(a.trim())) return "greeting";

  if (
    /\b(hambre|sed|hambriento|comer|comida|beb|beber|víveres|provision|refugio|resguard|abrigo|cerca|cercan|alrededor|barrio|lugar|lugares|dónde\b|donde\b|hay\b|necesito|busco\s|mapa|ruta)/.test(a)
  ) {
    return "survival_probe";
  }
  if (/\bdónde\b|\bdonde\b|\bcómo lleg|como lleg|hay un|hay alguna|calle|metro|farmacia|bodega|local|sitio\b/.test(a)) {
    return "localization";
  }

  if (/huir|correr|escap|retroced|salir pitando|arrancar/.test(a)) return "flee";
  if (/dispar|golpe|atac|apuñal|morder|arrancar (?!de)/.test(a)) return "violence";
  if (/persuad|hablar|mentir|seduc|negoci|pregunt|decir|insinu|llamar|cómo están|cuéntame/.test(a)) return "social";
  if (/investig|buscar|mirar|oir|oler|rastrear|hacke|examin|leer/.test(a)) return "examine";
  if (/camin|entrar|subir|bajar|cruzar|ir\b|voy\b|dirig|me muevo/.test(a)) return "move";
  if (/disciplina|auspex|celeridad|presencia|dominat|protean|barbarie/.test(a)) return "magic";

  return "ambient";
}
