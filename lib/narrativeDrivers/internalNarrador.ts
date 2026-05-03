import { normalizeStrand, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Hash estable para elegir variantes sin aleatorio puro entre renders. */
function stableHash(parts: string[]): number {
  const s = parts.filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(items: readonly T[], h: number, salt: number): T {
  return items[(h + salt) % items.length]!;
}

function chronicleFingerprint(c?: NarradorRequestBody["chronicle"]): string {
  if (!c) return "";
  return [c.AMBIENTE, c.TENSION, c.ESTADO_GLOBAL, c.foundations, c.VINCULO_HILOS]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .join("·")
    .slice(0, 400);
}

type Intent =
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

function classifyIntent(action: string): Intent {
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

function threatTone(n: number): string {
  const tiers = [
    "La calle apenas susurra riesgo: podrías fingir normalidad otro trecho.",
    "La noche sigue su ritmo; el peligro es rumor, no certeza.",
    "La ciudad te devuelve una mirada fría, calculadora.",
    "El telón urbano parece más delgado: sombras con intención.",
    "Hay demasiadas antenas mirando tu misma dirección.",
  ];
  const idx = Math.min(tiers.length - 1, Math.max(0, Math.floor((n ?? 2) / 2)));
  return tiers[idx]!;
}

function strandFlavor(strand: NarrativeStrand, strandSeed: number): string {
  if (strand === "paralela") {
    return pick(
      [
        "Este hilo es tu incursión lateral: detalle íntimo o contacto, sin pisar la escena grande.",
        "Paralela: piezas íntimas o negociaciones privadas que no están en foco público.",
        "Hilo privado — lo que hagas puede no salir del monitor, hasta que sí salga.",
      ],
      strandSeed,
      0,
    );
  }
  if (strand === "vivo") {
    return pick(
      [
        "Continuidad de mesa física: tacto presente y reglas cercanas.",
        "Mesa viva — prioriza claridad física antes que florituras de terminal.",
      ],
      strandSeed,
      1,
    );
  }
  return pick(
    [
      "Crónica principal: el tablero compartido registra tus piezas públicas.",
      "Canal Principal — lo que hagas cuenta para la ciudad vista desde el Nexo.",
    ],
    strandSeed,
    2,
  );
}

/** Banco de párrafos por intención; el hash elige combinaciones cada turno. */
const OPENERS: Record<Intent, readonly string[]> = {
  greeting: [
    "Alguien (o algo) marca tu presencia en el canal antes de que completes el ritual de saludo.",
    "El Nexo amortigua tu ‘hola’ con estática casi amable; igual queda hueco donde deberían ir datos.",
    "La ciudad no contesta verbalmente — pero reorganiza tus prioridades: saludaste, ahora qué quieres.",
  ],
  survival_probe: [
    "Cuerpo en aviso: la Sangre y el agua corriente compiten por tu atención en el mismo mapa mental.",
    "Localizar refugio o víveres no es turismo: es trazar una ruta donde la geografía no vende tus costillas.",
    "Tu pregunta de supervivencia se traduce como ‘quién tiene llave aquí’, aunque el edificio no tenga nombre.",
  ],
  localization: [
    "Pedir ubicación en esta ciudad equivale a decir quién debe enterarse de que vas en camino.",
    "Orientarte implica datos sucios — farolas, vigilantes improvisados y olores industriales falsos.",
    "Ningún mapa traza la segunda ciudad que se sobrepone a la primera entre medianoche y el alba.",
  ],
  examine: [
    "Afirmas la mirada / el gesto investigador y lo que llega viene en paquetes incompletos — polvo, silencios negociados, ausencias demasiado limpias.",
  ],
  move: [
    "El paso redefine el lienzo urbano; Santiago tiende cortes cinematográficos: transición rápida, siguiente conflicto en la esquina.",
  ],
  social: [
    "Las sílabas cargan etiquetas adhesivas entre ustedes: lo dicho ordena quién debe ceder medio paso.",
  ],
  violence: [
    "El cuerpo memoriza antes que el protocolo — roce, frenado abrupto y el rumor metálico del entorno infiltrándose en la escena.",
  ],
  flee: [
    "Primero la salida: el entorno se desplaza en rutas paralelas hasta que una se queda marcada.",
  ],
  magic: [
    "El don estira lo visible hacia registros prohibidos — sombras con memoria, tiempo que tropieza y quien observa desde afuera toma apuntes.",
  ],
  ambient: [
    "El Cronista interno registra superficies húmedas, neón anémico y el silencio de una radio jamás encendida del todo.",
  ],
};

const MID: Record<Intent, readonly string[]> = {
  greeting: [
    "Si buscas trabajo real, no te quedarás solo con formalidades: dime qué pisas o qué evitas.",
    "Este canal no perdona vaguedad cuando la Bestia anda cerca.",
    "Puedes abrir tema o seguir con el eco; la escena necesita un vector.",
  ],
  survival_probe: [
    "Tres frentes útiles: agua/pan en sitios anónimos · refugios con ‘dueño’ taciturno · rutas donde la cámara tiene mala vista.",
    "Antes del detalle gastronómico, decide riesgo: ¿exponerte al público o negociar con intermediarios?",
    "Si tienes Clan o contacto cercano en el CODEX, apóyate en ese ancla antes de lanzarte a zonas nuevas.",
  ],
  localization: [
    "Esboza un radio desde tu punto (barrio nombre o punto de vista) si quieres que el siguiente tick sea táctico, no cosmético.",
    "Hay metros abiertos, pasajes de servicios y patios que Google no cataloga igual que la camarilla.",
    "Prueba decidir transporte versus calle lateral; cambia amenaza y consecuencias sin magic numbers.",
  ],
  examine: [
    "Si algo observa donde no debe, aparece como latencia: ese retardo incómodo entre lo percibido y lo conveniente.",
  ],
  move: ["Las esquinas son bifurcaciones morales antes que cartográficas: eliges peso sobre la nuca o silencios que te guían."],
  social: ["La máscara social sostiene la escena; debajo la Bestia vota sí sin consultar tus modales."],
  violence: ["La mesa marcó alcance ético antes; aquí solo queda el desgaste de lo que no se puede deshacer del todo."],
  flee: ["El refugio es temporal; la ciudad archiva tu trayectoria como quien archiva deudas mal liquidadas."],
  magic: ["El poder deja olor a ozono y reglas rotas; quien mira sin entender a veces llama a quien sí entiende."],
  ambient: [
    "Lo cotidiano se inclina: una tubería suena demasiado fuerte, un pasillo se alarga un tramo de más y el viento trae neumáticos húmedos.",
  ],
};

const HOOKS_BY_INTENT: Record<Intent, readonly string[]> = {
  greeting: [
    "Declara intención: ¿explorar, negociar o esconderte?",
    "Arma un movimiento concreto (lugar o persona) y el Cronista lo amarra a la calle.",
    "¿Qué quieres averiguar con una sola acción física?",
  ],
  survival_probe: [
    "Elige uno: registrar un local humilde · sondear rumor en feria informal · llamar favorecido CODEX cercano.",
    "Prueba establecer orden de urgencia: ¿agua antes que techo?",
    "Escribe cómo mueves el mapa una cuadra sin ser visto.",
  ],
  localization: [
    "Nombra un hito cercano al refugio o al último encuentro importante.",
    "Decide si vas a pie o usando transporte; la escena lo traduce en vectores diferentes.",
    "¿Prefieres ruta rápida (exposición) o ruta lateral (Tiempo perdido ≠ seguridad)?",
  ],
  examine: ["Afina el foco sensualmente: ¿vista olfato tacto archivo digital?", "Localiza objeto o marca que sospechas manipulado."],
  move: ["Especifica destino incluso vago (‘hacia Providencia’ sirve mejor que solo ‘salgo’).", "¿Entras frontal o esperas ciclo peatonal menos expuesto?"],
  social: ["Define postura táctica: ¿mentir estable, medio verdad brutal o chantaje suave?", "Nombre o arquetipo si hablas con un tercero."],
  violence: ["Confirma escala: ¿estrés menor o escena alta sangre MJ?", "Señala qué recurso llevas antes de lanzar tirada física/manifestación."],
  flee: ["Trazamos salida rápida, lateral u ocultamiento en mismo escenario?", "¿Dejas cebo o llevas evidencia sensible?"],
  magic: ["Especifica don y consecuencias aceptadas por la mesa si falla.", "¿Actúas rápido o preparas símbolo físico cercano?"],
  ambient: [
    "¿Qué micro-acción lanzas ante la ciudad indiferente?",
    "Propón rumor o infraestructura incómoda que quieras anclar antes del próximo tirón.",
    "Si hay ideas en Repositorio, referencia una línea específica de allí.",
  ],
};

export function generateInternalNarrador(body: NarradorRequestBody): {
  narracion: string;
  resumen_actualizado?: string;
  sugerencias?: string[];
} {
  const strand: NarrativeStrand = normalizeStrand(body.narrativeStrand);
  const intent = classifyIntent(body.playerAction);
  const disrupt = body.synapticDisruption?.trim();

  const hBase = stableHash([
    strand,
    body.playerAction.trim().slice(0, 520),
    body.sheetSummary?.slice?.(0, 400) ?? "",
    chronicleFingerprint(body.chronicle),
    (body.rollingSummary ?? "").slice(0, 200),
    ...(body.recentLogs?.slice(-4).map((l) => l.text.slice(0, 80)) ?? []),
  ]);

  const opener = pick(OPENERS[intent], hBase, 0);
  const mid = pick(MID[intent], hBase, 3);
  const hookA = pick(HOOKS_BY_INTENT[intent], hBase, 7);
  const hookB = pick(HOOKS_BY_INTENT[intent], hBase, 17);
  const hookC = pick(HOOKS_BY_INTENT[intent], hBase, 27);
  const sugerencias = [clip(hookA, 120), clip(hookB, 120), clip(hookC, 120)].filter(Boolean);

  const disruptBlock = disrupt ? `\n\nDisrupción sináptica activa: ${disrupt.slice(0, 900)}` : "";

  const narracion = [
    `[${STRAND_LABEL[strand]}]`,
    strandFlavor(strand, hBase >>> 5),
    "",
    opener,
    mid,
    "",
    threatTone(body.inquisitionThreat),
    "",
    "› Impulso (motor interno) — mismo contenido que verás como sugerencias pulsables en el cliente:",
    `  · ${hookA}`,
    `  · ${hookB}`,
    `  · ${hookC}`,
    "",
    `Eco de la acción: ${clip(body.playerAction, 520)}`,
    disruptBlock,
  ]
    .join("\n")
    .trim();

  const resumen_actualizado = clip(`${STRAND_LABEL[strand]} · ${intent}: ${clip(body.playerAction, 110)} · σ${body.inquisitionThreat}`, 340);

  return { narracion, resumen_actualizado, sugerencias };
}
