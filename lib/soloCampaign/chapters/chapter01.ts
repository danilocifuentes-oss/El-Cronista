import type { SoloChapter } from "@/lib/soloCampaign/types";

/**
 * Crónica “Santiago en Cenizas” (novela) — Capítulo 1.
 * Mantiene la voz en primera persona y usa opciones convergentes para dar agencia sin romper la línea canónica.
 */
export const chapter01: SoloChapter = {
  id: "chapter01",
  title: "Santiago en Cenizas · Capítulo 1 · El Beso del Mapocho",
  description:
    "El primer hambre en el centro de Santiago: Teatinos, Bandera y el cauce del Mapocho como bautismo de sangre.",
  startSceneId: "n1_1",
  scenes: [
    {
      id: "n1_1",
      chapterId: "chapter01",
      title: "1.1 · Teatinos · Imprenta abandonada",
      text: `El hambre de un hombre es una punzada en el estómago; la que yo sentía era una marea negra que amenazaba con ahogar mi último rastro de razón.

Me desperté antes de que el último rastro de arrebol desapareciera tras la Cordillera de los Andes. El refugio, un sótano húmedo en una de las antiguas imprentas abandonadas de la calle Teatinos, olía a tinta seca y a algo mucho más antiguo: el polvo de los que ya no están. No recordaba haberme acostado. Solo recordaba el frío del frasco que aquel anciano me había entregado en la calle Bandera y el sabor metálico, eléctrico, que todavía me escocía en la garganta como si hubiera tragado monedas de cobre.

Me puse de pie. Mis articulaciones no crujieron. Mi corazón no latió al incorporarme. Esa ausencia de ritmo interno era el primer horror, el silencio absoluto de un motor que ha dejado de funcionar pero sigue impulsando la máquina.`,
      clanFlavor: {
        brujah: "La falta de pulso no te apaga: te enciende. En tu pecho, la rabia busca una salida.",
        ventrue: "El silencio del corazón te indigna. Lo inaceptable requiere control, no pánico.",
        toreador: "La imprenta es una cueva de papel muerto; la fealdad te muerde como un insulto personal.",
        malkavian: "El silencio interno no es vacío: es una sala llena de ecos que aún no sabes nombrar.",
      },
      options: [
        {
          id: "n1_1_move",
          type: "dialogue",
          text: "Tengo que moverme. Subir a la superficie y seguir el instinto.",
          requirement: { type: "none" },
          nextSceneId: "n1_2",
          effects: [{ type: "setFlag", flag: "novel_ch1_teatinos_surface" }],
        },
        {
          id: "n1_1_hold",
          type: "dialogue",
          text: "Quedarme un minuto en la oscuridad y ordenar la memoria: el frasco, Bandera, el sabor metálico.",
          requirement: { type: "none" },
          nextSceneId: "n1_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch1_teatinos_recall" }],
        },
      ],
    },
    {
      id: "n1_2",
      chapterId: "chapter01",
      title: "1.2 · Parque Forestal · El borde del río",
      text: `Salí a la superficie. Santiago me recibió con su habitual indiferencia. El tráfico de la hora punta todavía congestionaba el centro, un río de metal y luces rojas que serpenteaba bajo el smog. Caminé hacia el norte, hacia el río, arrastrado por un instinto que no era mío.

Al llegar a las barandas de hierro del Parque Forestal, me detuve. La necesidad golpeó de nuevo, pero esta vez con garras. Mis sentidos, agudizados hasta la agonía, comenzaron a filtrar el mundo de una forma nueva y aterradora. Ya no veía personas; veía recipientes de calor.

Mis encías dolían. Sentí una presión insoportable en la mandíbula, un estiramiento de los tejidos que me hizo gemir de dolor. Si no encontraba una salida para ese fuego líquido que me recorría, algo dentro de mí —una sombra que apenas empezaba a conocer— rompería las cadenas y tomaría el control de mis manos.`,
      options: [
        {
          id: "n1_2_stalk",
          type: "dialogue",
          text: "Elegir un objetivo con cuidado, como si la ciudad fuese un tablero.",
          requirement: { type: "none" },
          nextSceneId: "n1_3",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch1_mapocho_careful" }],
        },
        {
          id: "n1_2_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Percepción afilada",
          text: "Dejar que los sentidos se abran y rastrear el pulso más cercano, el más fácil.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n1_3",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch1_mapocho_auspex" }],
        },
        {
          id: "n1_2_presence",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "Gravedad social",
          text: "No cazar: atraer. Volver mi quietud en invitación para que alguien se acerque.",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "n1_3",
          effects: [{ type: "setFlag", flag: "novel_ch1_mapocho_presence" }],
        },
      ],
    },
    {
      id: "n1_3",
      chapterId: "chapter01",
      title: "1.3 · El muchacho de la baranda",
      text: `—¿Buscando algo, flaco?

Era un muchacho, no tendría más de veinte años. Llevaba una chaqueta deportiva sucia y una gorra que le sombreaba los ojos. Estaba apoyado en la baranda, a escasos metros de mí. Tenía un cigarrillo encendido y el humo me supo a ceniza volcánica, pero bajo ese olor rancio, percibí lo que realmente buscaba. El aroma de su vida. La sangre caliente bajo la piel de su cuello era más embriagadora que cualquier perfume.

Él no lo sabía, pero estaba coqueteando con su propia muerte.`,
      options: [
        {
          id: "n1_3_lure",
          type: "dialogue",
          text: "Invitarlo abajo hacia la oscuridad del cauce, fingiendo tener algo que ofrecer.",
          requirement: { type: "none" },
          nextSceneId: "n1_4",
          effects: [{ type: "setFlag", flag: "novel_ch1_lure_downstairs" }],
        },
        {
          id: "n1_3_dominate",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Orden silenciosa",
          text: "Ordenarle que me acompañe sin preguntar.",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 1 },
          nextSceneId: "n1_4",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch1_dominate_lure" }],
        },
        {
          id: "n1_3_potence",
          type: "discipline",
          discipline: "potence",
          disciplineTitle: "Violencia eficiente",
          text: "No alargarlo: tomarlo por el hombro y conducirlo abajo antes de que el hambre me delate.",
          requirement: { type: "discipline", discipline: "potence", minLevel: 1 },
          nextSceneId: "n1_4",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch1_force_lure" }],
        },
      ],
    },
    {
      id: "n1_4",
      chapterId: "chapter01",
      title: "1.4 · Bajo el puente · El primer beso",
      text: `Allí, bajo el arco del puente, donde el agua turbia golpeaba las piedras, me detuve.

No lo dejé terminar. Me moví con una velocidad que mi cerebro no pudo procesar, un espasmo de violencia eficiente. Lo pegué contra el muro de piedra fría.

Clavé los dientes con una desesperación salvaje.

No hubo dolor. Al menos, no para mí. Fue el éxtasis. La sangre fluyó, espesa y vital, llenando el vacío helado de mis venas.`,
      options: [
        {
          id: "n1_4_feed_control",
          type: "dialogue",
          text: "Beber lo justo. Dejarlo vivo, con el recuerdo roto.",
          requirement: { type: "none" },
          nextSceneId: "n1_end",
          effects: [
            { type: "hungerDelta", delta: -3 },
            { type: "humanityDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch1_feed_spare" },
          ],
        },
        {
          id: "n1_4_feed_hard",
          type: "dialogue",
          text: "Beber hasta que la sombra en mi mente se retire satisfecha.",
          requirement: { type: "none" },
          nextSceneId: "n1_end",
          effects: [
            { type: "hungerDelta", delta: -4 },
            { type: "humanityDelta", delta: -2 },
            { type: "setFlag", flag: "novel_ch1_feed_brutal" },
          ],
        },
        {
          id: "n1_4_auspex_watch",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Sombra sobre el puente",
          text: "Antes de irme, abrir el oído interior: quiero saber si alguien mira.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n1_end",
          effects: [{ type: "setFlag", flag: "novel_ch1_watch_sensed" }],
        },
      ],
    },
    {
      id: "n1_end",
      chapterId: "chapter01",
      title: "1.E · La mirada",
      text: `Me limpié la boca con el dorso de la mano. Me sentía poderoso, pero también irremediablemente sucio.

Miré hacia arriba. Sobre el puente, una figura me observaba. Inmóvil. Silenciosa. No era un humano; tenía esa misma quietud de estatua que yo acababa de estrenar.

El Mapocho me había dado el sustento, pero aquella mirada me recordaba que, en esta ciudad, nada se toma sin pagar un precio.`,
      options: [
        {
          id: "n1_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "n1_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter02" }],
        },
        {
          id: "n1_end_hide",
          type: "dialogue",
          text: "Alejarme sin mirar atrás. Que la ciudad crea que esto no ocurrió.",
          requirement: { type: "none" },
          nextSceneId: "n1_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter02" }, { type: "setFlag", flag: "novel_ch1_hide_after_feed" }],
        },
      ],
    },
  ],
};
