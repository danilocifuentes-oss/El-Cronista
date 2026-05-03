import { normalizeStrand, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";
import { assembleNarrativeWeaveBrief, parseCodexSignalsFromSheetSummary } from "@/lib/narrativeAssembly";
import { weaveKnowledgeIntoActionSuggestions } from "@/lib/narrativeAssembly/actionKnowledge";
import { selectLoreFragments } from "@/lib/narratorKnowledge/selectLore";

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
    "La ciudad concede un respiro corto; el peligro sigue siendo rumor antes que sentencia escrita.",
    "La noche sigue su ritmo; el peligro es rumor, no certeza.",
    "La ciudad te devuelve una mirada fría, calculadora.",
    "El rumor de patrullas se mezcla con metal húmedo y decisiones pendientes en la esquina siguiente.",
    "El telón urbano parece más delgado: sombras arrastran intención como quien arrastra cola de deudas.",
    "Cada farola parece anotar tus pasos como si cobrara peaje por cada metro nocturno recorrido.",
    "El silencio no garantiza ausencia de testigos: algunos clips cargan tarde y con título mentiroso listo.",
    "Repetir tres noches el mismo patrón es firma silenciosa para quien archiva rutas en servidor ajeno.",
    "Hay demasiadas antenas mirando tu misma dirección desde ángulos que no coinciden entre sí.",
    "Un dron barato puede ser turismo banal o doctrina portátil hasta que enseña un logo frío en pantalla.",
    "El cordón policial viejo huele a permiso recién timbrado y a rumor caro ganando volumen en subida.",
    "La multitud finge indiferencia hasta que gritan seguridad ciudadana con voz de acero sin rostro claro.",
    "Un neón titila con ritmo de cazador que mide si vale la pena dejarte otro minuto en la calle.",
    "Cuando el rumor urbano etiqueta tu bloque, caminá como si hubiese segunda visita sellada en agenda fría.",
  ];
  const idx = Math.min(tiers.length - 1, Math.max(0, Math.floor((n ?? 2) / 2)));
  return tiers[idx]!;
}

/** Banco de párrafos por intención; el hash elige combinaciones cada turno. */
const OPENERS: Record<Intent, readonly string[]> = {
  greeting: [
    "Algo en la habitación — o en la calle — nota tu saludo antes de que puedas hacerlo insignificante.",
    "Tu palabra queda suspendida entre neón viejo y aire cargado de metal húmedo.",
    "No hay respuesta clara todavía, pero el tiempo se reparte igual: después del saludo sigue otro borde.",
    "El eco del saludo golpea un vidrio sucio y vuelve como pregunta que no llegaste a formular del todo.",
    "Alguien en la penumbra acomodó la respiración para escucharte sin moverse tanto como vos.",
    "La cortesía funciona igual moneda aceptada: el barrio prefiere ruido educado que silencio demasiado limpio.",
    "Sembrás un hola pequeño y lo sentís asentarse donde no aparece titular conocido ni permiso cortés.",
    "Una risa lejana te corta la frase como si hubiera turno de interrupciones en esta vereda igual.",
    "Tu saludo queda entre dos corrientes de aire: una cansada mortal, otra con hambre que disimula mejor.",
  ],
  survival_probe: [
    "Cuerpo en aviso: la Sangre y el agua corriente compiten por tu atención en el mismo mapa mental.",
    "Localizar refugio o víveres no es turismo: es trazar una ruta donde la geografía no vende tus costillas.",
    "Tu pregunta de supervivencia se traduce como ‘quién tiene llave aquí’, aunque el edificio no tenga nombre.",
    "Tu cuerpo pide víveres y cobertura con urgencia vulgar de quien ya no cuenta horas igual humanas igual.",
    "Cada techo nuevo tiene dueño nuevo de secretos: elegís quién conoce tu sombra mejor que tus excusas rápidas.",
    "Olores a cocina económica funcionan igual que rumores modestos de hambre común pisando esta vereda igual que vos igual.",
    "El mapa callejero lúcido lleva olores industriales que mienten y farolas cansadas que aún dicen verdades prácticas.",
    "La calle cobra tus rutas igual cobra nueva deuda silenciosa cuando dos noches repetís camino igual sin nuevo testigo medio.",
    "Rutas con testigos ágiles cuestan oídos y favores igual sin recibo igual claro todavía para tu contabilidad nueva.",
    "Refugios con dueño nuevo áspero a veces igual vencen al techo libre con cámara oculta que finge candidez fría.",
  ],
  localization: [
    "Pedir ubicación en esta ciudad equivale a decir quién debe enterarse de que vas en camino.",
    "Orientarte implica datos sucios — farolas, vigilantes improvisados y olores industriales falsos.",
    "Ningún mapa traza la segunda ciudad que se sobrepone a la primera entre medianoche y el alba.",
    "Pedís dirección y el matiz de tu prisa llega antes que tu cara lo confirme con palabras humanas tranquilas.",
    "La geografía táctica aparece sólo después de ubicar vigilantes improvisados y fugas de olor conocidas por otros.",
    "El ancla real suele ser zumbido oxidado en un transformador que marca un cruce donde el cartel mentiría igual.",
    "Transporte rápido y vereda lateral te venden amenazas distintas: elegí según rumor que podés cargar esta noche igual.",
    "Apps limpias igual no arreglan patios sucios ni libretas camarilla con tinta distinta y fecha al margen igual.",
    "Decidir radio desde barrio o hito concreto cambia el siguiente movimiento de escenografía a movimiento real.",
  ],
  examine: [
    "Afirmas la mirada / el gesto investigador y lo que llega viene en paquetes incompletos — polvo, silencios negociados, ausencias demasiado limpias.",
    "Lo percibido llega en dos capas: una humana inmediata y otra cargada de memoria que nadie envió por correo mortal.",
    "Hasta el polvo puede elegir mostrarse después si conviene al rumor que ordena esta esquina fría igual.",
  ],
  move: [
    "El paso redefine el lienzo urbano; Santiago tiende cortes cinematográficos: transición rápida, siguiente conflicto en la esquina.",
    "Cada zancada reescribe coordenadas: semáforo nuevo, rumor nuevo, sombra nueva antes de fichar la próxima manzana igual.",
    "La distancia de hoy vuelve mañana como pregunta de testigos ocasionales que vos nunca llamaste igual.",
  ],
  social: [
    "Las sílabas cargan etiquetas adhesivas entre ustedes: lo dicho ordena quién debe ceder medio paso.",
    "Cada frase reordena cercanías aceptadas; el pacto inmortal registra el roce antes de que humanos sellen etiquetas.",
    "Bajás la voz un poco y obligás acercamiento de oído: la Bestia mide distancia aceptada igual sin permiso explícito medio.",
  ],
  violence: [
    "El cuerpo memoriza antes que el protocolo — roce, frenado abrupto y el rumor metálico del entorno infiltrándose en la escena.",
    "Hombros quietos anuncian golpe antes que modales humanos alcancen a negociar la escena con palabras secas.",
    "El pavimento guarda huellas de lo que empujaste antes de que el papel oficial aclare permisos o culpas.",
  ],
  flee: [
    "Primero la salida: el entorno se desplaza en rutas paralelas hasta que una se queda marcada.",
    "Varias fugas compiten hasta que sólo una arrastra sombra fría pegada al taco recién usado.",
    "La ciudad archiva huidas igual archiva deudas mal liquidadas en cajón repetido de temporada fría.",
  ],
  magic: [
    "El don estira lo visible hacia registros prohibidos — sombras con memoria, tiempo que tropieza y quien observa desde afuera toma apuntes.",
    "El tiempo tropieza en escalón donde plan carnal no llega; tus sombras cargan memoria incómoda para testigos rápidos igual.",
    "Olor fugaz a ozono y reglas torcidas: mirada distraída termina llamando a quien sí sabe cobrar el secreto.",
  ],
  ambient: [
    "Superficies húmedas reverberan despacio; un neón agoniza en el marco del escaparate y ninguna radio termina de encenderse.",
    "Radios repiten bucles como mal chiste; la ciudad lo toma igual en serio igual que advertencia administrativa fría.",
    "Goteras y vientos con olor a goma quemada llevan confesiones a medias hasta próxima vereda despierta nueva.",
  ],
};

const MID: Record<Intent, readonly string[]> = {
  greeting: [
    "Si buscas trabajo de verdad, no te quedarás en formalidades: qué pisas importa tanto como a quién miras.",
    "La ciudad no perdona vaguedad cuando la Bestia pisa de cerca.",
    "Puedes abrir tema o dejar que el eco haga hueco — la escena sigue igual de hambrienta.",
  ],
  survival_probe: [
    "Tres frentes útiles: agua/pan en sitios anónimos · refugios con ‘dueño’ taciturno · rutas donde la cámara tiene mala vista.",
    "Antes del detalle gastronómico, decide riesgo: ¿exponerte al público o negociar con intermediarios?",
    "Si tu linaje arrastra vínculos o favores cercanos en la ciudad, usa ese ancla antes de explorar zonas nuevas.",
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
  violence: [
    "Lo que empujaste deja textura en el aire: sangre, vergüenza o silencio pactado demasiado alto.",
  ],
  flee: ["El refugio es temporal; la ciudad archiva tu trayectoria como quien archiva deudas mal liquidadas."],
  magic: ["El poder deja olor a ozono y reglas rotas; quien mira sin entender a veces llama a quien sí entiende."],
  ambient: [
    "Lo cotidiano se inclina: una tubería suena demasiado fuerte, un pasillo se alarga un tramo de más y el viento trae neumáticos húmedos.",
  ],
};

/** Ritmos jugables — primera persona, sin manual de mesa. */
const PLAYER_BEATS_COMMON: readonly string[] = [
  "Cuento tres respiraciones y vuelvo a mirar antes de moverme otro metro.",
  "Afino los hombros; el silencio en la calle pesa igual que cualquier insulto.",
  "Dejo pasar dos figuras antes de ocupar yo el hueco donde no quiero ser visto.",
  "Me detengo un instante donde el vidrio deforma la luz hasta volverla sospecha.",
  "Humedezco labios ya secos sin abrir tema; primero necesito ubicar el sonido nuevo.",
];

function uniqueLines(xs: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of xs) {
    const t = raw.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Devuelve exactamente hasta 3 líneas distintas, evitando repeticiones de arrays cortos. */
function pickThreeActionLines(primary: readonly string[], h: number, common: readonly string[]): string[] {
  const cand = uniqueLines([...primary, ...common]);
  if (cand.length === 0) return [];
  const n = cand.length;
  if (n === 1) return [clip(cand[0]!, 118)];
  let step = 1 + (Math.abs(h >> 5) % (n > 2 ? n - 1 : 1));
  if (step >= n) step = Math.max(1, n - 1) || 1;
  let i = Math.abs(h * 7919) % n;
  const picks: string[] = [];
  for (let tries = 0; tries < n * 4 && picks.length < 3; tries += 1) {
    const line = cand[i % n]!;
    const clipped = clip(line, 118);
    if (!picks.includes(clipped)) picks.push(clipped);
    i += step;
  }
  while (picks.length < 3 && picks.length < n) {
    const line = cand[picks.length % n]!;
    const clipped = clip(line, 118);
    if (!picks.includes(clipped)) picks.push(clipped);
  }
  return picks.slice(0, 3);
}

const PLAYER_BEATS: Record<Intent, readonly string[]> = {
  greeting: [
    "Asiento la gorra o la capucha y espero quién mueve antes la barbilla.",
    "Dejo un saludo medio en el aire como cebo cortés y mido cómo cae.",
    "Enciendo un cigarro apenas para tener excusa si me miran desde el décimo.",
    "Deslizo la vista hacia una salida secundaria antes de terminar de hablar.",
  ],
  survival_probe: [
    "Priorizo donde venden pan barato antes de llamar favores caros.",
    "Sondeo con el codo apoyado en el mostrador si el agua corriente es potable o teatro.",
    "Sigo un olor a fritanga que promete comida y testigos de carne y hueso.",
    "Pregunto por un techo sin dar nombre claro; quiero ver si el silencio se alarga.",
    "Trazo un círculo de tres cuadras alrededor del refugio sin repetir calle.",
  ],
  localization: [
    "Me guío por el zumbido del transformador que siempre marca el mismo cruce.",
    "Elijo el pasillo de servicio que huele a detergente caro y permiso falso.",
    "Subo una estación antes y camino atrás hasta que mapa mental calce con el físico.",
    "Le pido tiempo a una parada de taxis para ver desde dónde me siguen mejor.",
    "Ubico dos hitos brillantes antes de moverme; si uno desaparezco corro cancelan ambos.",
  ],
  examine: [
    "Fijo dedos en una mota que no debería estar ahí y la huelo al ras.",
    "Dejo pasar el reflejo de un rostro medio segundo después del mío.",
    "Leo etiquetas medio borradas en un envase que juraría estar demasiado limpio.",
    "Meto el volumen muy bajo y localizo donde el vidrio tiembla igual que el pecho.",
    "Pasó un dedo en el borde del felpudo; alguien trajo algo húmedo recién.",
    "Intercepto vibración vieja del portón que no cuadra con la hora de cierre oficial.",
    "Anoto memoria táctil antes que visual porque la luz puede mentir mejor.",
    "Me agacho un grado más donde la cámara finge no tener.",
  ],
  move: [
    "Cruce la primera sombra proyectada desde el alto edificio; no voy por el medio.",
    "Entro después de otro peatón hasta que nuestras pisadas parezcan uno solo.",
    "Subo pisos en ascensor ocupado porque el espejo me delata menos que el hueco.",
    "Bajo por escalera de incendios sin prisa falsa; el metal suena demasiado si corro.",
    "Cambio acera cuando el farol parpadea dos veces seguidas.",
    "Paso el semáforo en amarillo largo y aprieto el paso sin correr de verdad.",
  ],
  social: [
    "Dejo caer la pregunta más incómoda entre dos tragos de aire acondicionado barato.",
    "Mantengo la sonrisa un milímetro más de lo que el otro aguanta.",
    "Invento un nombre falso con apellido que suene de barrio conocido aquí.",
    "Reconozco medio segundo tarde cuando me mienten; no lo digo; lo guardo.",
    "Uso mi hombro para ocupar medio paso más de espacio cercano.",
    "Hablo bajito porque obligo a inclinarse hasta oler mi pulso contenido.",
    "Pregunto por alguien que no existe sólo para medir cómo corrigen la mentira.",
    "Susurro un favor que suena a deuda sin firmar todavía.",
    "Cambio de idioma un par de palabras para ver si pestañean distinto.",
    "Dejo que el silencio me crea espacio antes de volver a hablar.",
  ],
  violence: [
    "Cierro el radio del codo hasta que el aire chirríe entre nosotros.",
    "Deslizo el pie para cortar línea de retirada sin anunciarlo.",
    "Leo dónde guarda el peso real antes de que levante la mano del bolsillo.",
    "Hago contacto visual con un tercero que no debería estar mirando todavía.",
    "Ralentizo el gesto para que parezca accidente si alguien graba.",
    "Insinúo el filo del objeto sin mostrarlo entero todavía.",
    "Preparo hombro y cadera como si fuera a empujar una puerta pesada, no un cuerpo.",
  ],
  flee: [
    "Elijo la bajada con olor a orina vieja porque nadie mira allí con ganas.",
    "Cruzo entre dos autos apretados hasta que el metal me araña el abrigo.",
    "Tiro moneda falsa al suelo para que alguien se agache y me tape un segundo.",
    "Subo a bus que no es el mío y bajo dos paradas después caminando tranquilo.",
    "Entro a farmacia con excusa de pastillas y salgo por la trastienda si abre.",
  ],
  magic: [
    "Dejo que el don suba por la nuca hasta erizar el vello sin mostrar diente.",
    "Amplifico un detalle visual hasta que el otro parpadea tarde.",
    "Olor a ozono breve; finjo estornudar para encubrirlo.",
    "Compro tiempo con una frase hueca mientras el poder hace el trabajo sucio.",
    "Inclino sombra bajo mis pies un grado imposible para el ojo mortal apurado.",
  ],
  ambient: [
    "Sigo el olor a churrasco quemado que viene de un ventilador roto.",
    "Dejo que el viento me empuje un paso hacia la luz amarilla equivocada.",
    "Le hago caso a la radio que vuelve a la misma canción como advertencia estúpida.",
    "Toco el metal oxidado hasta que sangro un poco y el dolor ordena pensamiento.",
    "Cuento vagones en paralelo porque el tic-tac coincide con algo que espero.",
    "Intercepto rumor de matrimonio peleándose tras ventana medio abierta.",
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
  const weave = assembleNarrativeWeaveBrief(body);

  const hBase = stableHash([
    strand,
    body.playerAction.trim().slice(0, 520),
    body.sheetSummary?.slice?.(0, 400) ?? "",
    chronicleFingerprint(body.chronicle),
    (body.rollingSummary ?? "").slice(0, 200),
    (body.worldNexusContext ?? "").slice(0, 320),
    weave.stableSeedParts.join("·"),
    ...(body.recentLogs?.slice(-4).map((l) => l.text.slice(0, 80)) ?? []),
  ]);

  const opener = pick(OPENERS[intent], hBase, 0);
  const mid = pick(MID[intent], hBase, 3);
  const codexSignals = parseCodexSignalsFromSheetSummary(body.sheetSummary ?? "");
  const sugerencias = weaveKnowledgeIntoActionSuggestions(
    codexSignals,
    pickThreeActionLines(PLAYER_BEATS[intent], hBase, PLAYER_BEATS_COMMON),
    hBase,
  );

  const loreBits = selectLoreFragments({
    narrativeStrand: strand,
    inquisitionThreat: body.inquisitionThreat,
    sheetSummary: body.sheetSummary,
    chronicle: body.chronicle,
    playerAction: body.playerAction,
    rollingSummary: body.rollingSummary,
    worldNexusContext: body.worldNexusContext,
  });
  const loreBlock = loreBits.length ? `\n\n${loreBits.join("\n")}` : "";

  const weaveBlock = weave.internalSceneFragment.trim()
    ? `\n\n${weave.internalSceneFragment.trim()}`
    : "";

  const disruptBlock = disrupt
    ? `\n\nAlgo irrumpió en lo previsto — ${disrupt.slice(0, 900)}`
    : "";

  const narracion = [opener, mid, loreBlock, weaveBlock, "", threatTone(body.inquisitionThreat), disruptBlock].join("\n").trim();

  const resumen_actualizado = clip(
    `${clip(body.playerAction, 120)} · ${intent} · tensión ciudad ${body.inquisitionThreat}`,
    300,
  );

  return { narracion, resumen_actualizado, sugerencias };
}
