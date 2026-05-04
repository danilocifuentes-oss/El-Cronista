import type { ClanId } from "@/lib/character";

/**
 * Presentación diegética al abrir la crónica (hilo paralelo), en segunda persona.
 * Calibre tonal al preludio común: densidad urbana, amenaza elegida, sin manual.
 */
export const CHRONICLE_CLAN_PRESENTATIONS: Record<ClanId, string> = {
  brujah: `No te confundan las calles con un escenario pobre: aquí la rabia tiene nombre de barrio y deuda judicial. Naciste de noche en un codo de Teatinos, pero lo que despierta en ti no es geografía: es la certeza de que el orden mintió primero. Santiago te ofrece indiferencia; tú respondes con pulso alto y mandíbula lista. Cada farola es tribunal barato; cada vereda, promesa incumplida. No te piden elegancia: te piden traducir la injusticia en movimiento antes de que la Bestia lo haga por ti y deje factura sangrienta. La ciudad te mira como quien reconoce a un pariente incómodo: te teme porque todavía crees que el mundo debería ser de otra manera —y eso, en la noche, es casi un arma.`,

  ventrue: `Otros confunden poder con estruendo; tú sabes que el poder huele a ascensor recién pulido, a tinta en contrato y a silencio que firma antes que la boca. Tu sangre no te grita en la calle: te ordena despachos interiores donde la derrota se llama “replantear objetivos”. Santiago, con su mezcla heroicamente vulgar de neón y deuda, es mina y cantera a la vez: extraes lealtades lentas, vomitas riesgos calculados. No vienes a suplicar entrada a la corte invisible: ya caminas dentro de ella cada vez que mantienes la voz baja y el gesto intacto mientras el hambre aprieta. Eres el tipo de monstruo que entiende que la eternidad se administra por agenda —y que la ciudad, al final, cobra hasta el aire que respiras.`,

  malkavian: `Para muchos el ruido es fondo; para ti es texto que aún no encontró su editor. Las grietas del mundo te susurran en coro desfasado: un semáforo tarde, una risa que viene de donde no hay nadie, un noticiero que repite la misma tragedia con reparto nuevo. No es “paranoia de manual”: es que la ciudad ensaya varias verdades a la vez y tú eres quien oye el ensayo. Aprenderás a moverte entre ecos sin volverte del todo loco —o quizás es tarde y eso ya no importa— porque en cada esquina hay una pista mal cortada que nadie más recoge. Santiago no te pide cordura; te pide que no rompas el plato antes de que sirvan el segundo acto.`,

  toreador: `La ciudad se ofrece como vitrina barata de luces frías; tú la recibes como escenario que puede herir. No hay escena neutra: cada reflejo en vidrio decide si te alaba o te condena, y ya no tienes la piel gruesa del mortal que pasa de largo. Santiago te enseña el precio exacto de la belleza gastada: el neón que enferma, el grafito que fue amor de joven, la gente que cree que lo estético no mata. Te queda claro que cada mirada es cuchillo embotado: incluso cuando ganas, pagas un poco de humanidad por el simple acto de elegir qué fragmento del mundo conservar. Aquí el arte y la catástrofe comparten butaca; tú eres el público de primera fila que aplaude hasta sangrar.`,

  nosferatu: `Tú no entras por la puerta principal: entras por el olor a humedad, por la rejilla que miente menos que el mapa, por el cable que alguien juró que ya estaba muerto. La ciudad te lee como infranqueable hasta que demuestras que el subsuelo también tiene memoria. Santiago te enseña rutas que el ojo limpio niega con vergüenza: conductos, sombras de servicio, firmas de pisadas repetidas. No te piden glamour; te piden supervivencia con inteligencia de rata noble. Cada rumor útil es moneda; cada testigo incómodo, deuda.`,

  tremere: `En la fachada risueña tú ya buscas el diagrama: sellos, simetrías, sangre como licencia y precio al mismo tiempo. La noche no es misterio romántico; es laboratorio sucio donde la ciudad condensa pactos invisibles. Santiago te ofrece capas de papel y capas de miedo; aprendes a leer ambas sin mancharte las manos del todo —aunque siempre quede rastro en los dedos. No te confundas: cada poder deja costura en el aire, y alguien más busca las tuyas antes de que tú encuentres las suyas.`,

  gangrel: `El asfalto no es filosofía: es hábitat. Tú llevas el olor a piel mojada, cordillera lejana como testigo frío, instinto que no pide permiso. Santiago te enseña fronteras que no están en el GPS: charcos que delimitan manada, viento que anuncia caza o trampa, neumáticos lentos que avisan depredadores coyunturales. La Bestia no es metáfora bonita: es brújula si no la sueltas, cadena si la dejas morder primero.`,

  thin_blood: `Tu sangre no firma contrato claro: eres glitch en la herencia, mezcla que el barrio lee primero como humano hasta que deja de convenir. Santiago te ofrece supersticiones importadas y apps de vecinos con la misma sed de testigo. Aprendes en el margen entre protocolo y rumor, midiendo cuándo teatralizar el miedo y cuándo romperlo. No hay red noble que te ampare: cada paso es improvisación con hambre encima.`,

  caitiff: `Sin apellido inmortal que ordene el relato, cada esquina es pregunta abierta. Tú improvisas etiqueta en tiempo real con dolor pragmático: lo que otros heredan, tú lo construyes con microscopio de supervivencia. La ciudad no te regala arquetipo; te cobra ambigüedad como deuda. Identidad nueva, grieta social: inventas coherencia donde otros pagan cortesía ancestral gratis.`,

  other: `Linaje singular o mal etiquetado: la plantilla cortés aún está vacía y la ciudad ya anotó tu nombre con tinta distinta. Tú obligas a la noche a leerte sin folklore listo; cada mirada es pentest social. Santiago no te da manual: te da espejo incompleto y hambre sin protocolo fino. Aprendes en la frontera entre lo que eres y lo que la calle decide que debieras ser.`,
};

export function getChronicleClanPresentation(clan: ClanId): string {
  return CHRONICLE_CLAN_PRESENTATIONS[clan] ?? CHRONICLE_CLAN_PRESENTATIONS.other;
}
