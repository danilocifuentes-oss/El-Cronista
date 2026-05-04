import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Crónica «Santiago en Cenizas» (novela) — Capítulo 1. Narración en segunda persona; opciones del jugador en primera persona. */
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
      text: `El hambre de un hombre es una punzada en el estómago; la tuya, ahora, es una marea negra que amenaza con ahogar el último rastro de razón.

Te despiertas antes de que el último rastro de arrebol desaparezca tras la Cordillera de los Andes. El refugio —un sótano húmedo en una de las antiguas imprentas abandonadas de la calle Teatinos— huele a tinta seca y a algo mucho más antiguo: el polvo de los que ya no están. No recuerdas haberte acostado. Solo el frío del frasco que un anciano te entregó en la calle Bandera y el sabor metálico, eléctrico, que te escuece en la garganta como si hubieras tragado monedas de cobre.

Te pones en pie. Tus articulaciones no crujen. El corazón no te late al incorporarte. Aquella ausencia de ritmo interno es el primer horror, el silencio absoluto de un motor que ha dejado de funcionar pero sigue impulsando la máquina.`,
      clanFlavor: {
        brujah: "La falta de pulso no te apaga: te enciende. En tu pecho, la rabia busca una salida.",
        ventrue: "El silencio del corazón te indigna. Lo inaceptable exige control, no pánico.",
        toreador: "La imprenta es cueva de papel muerto; la fealdad te hiere como un insulto personal.",
        malkavian:
          "Para ti el silencio interior no es vacío: es una sala llena de ecos que aún no puedes nombrar.",
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
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch1_teatinos_recall" },
          ],
        },
      ],
    },
    {
      id: "n1_2",
      chapterId: "chapter01",
      title: "1.2 · Parque Forestal · El borde del río",
      text: `Sales a la superficie. Santiago te recibe con su habitual indiferencia. El tráfico de la hora punta todavía congestionaba el centro, un río de metal y luces rojas que serpentea bajo el smog. Caminas hacia el norte, arrastrado por un instinto que no parece tuyo.

Al llegar a las barandas de hierro del Parque Forestal, te detienes. La necesidad golpea de nuevo, pero esta vez con garras. Tus sentidos, agudizados hasta la agonía, comienzan a filtrar el mundo de una forma nueva y aterradora. Ya no ves personas: ves recipientes de calor.

Te duelen las encías. Sientes una presión insoportable en la mandíbula, un estiramiento de los tejidos que te hace gemir de dolor. Si no hallas una salida para ese fuego líquido que te corre por dentro, algo en tu interior —una sombra que apenas empiezas a conocer— romperá las cadenas y tomará el control de tus manos.`,
      options: [
        {
          id: "n1_2_stalk",
          type: "dialogue",
          text: "Elegir un objetivo con cuidado, como si la ciudad fuese un tablero.",
          requirement: { type: "none" },
          nextSceneId: "n1_3",
          effects: [
            { type: "hungerDelta", delta: -1 },
            { type: "setFlag", flag: "novel_ch1_mapocho_careful" },
          ],
        },
        {
          id: "n1_2_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Percepción afilada",
          text: "Dejar que los sentidos se abran y rastrear el pulso más cercano, el más fácil.",
          requirement: {
            type: "discipline",
            discipline: "auspex",
            minLevel: 1,
          },
          nextSceneId: "n1_3",
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch1_mapocho_auspex" },
          ],
        },
        {
          id: "n1_2_presence",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "Gravedad social",
          text: "No cazar: atraer. Volver mi quietud en invitación para que alguien se acerque.",
          requirement: {
            type: "discipline",
            discipline: "presence",
            minLevel: 1,
          },
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

Era un muchacho; no tendría más de veinte años. Llevaba una chaqueta deportiva sucia y una gorra que le sombreaba los ojos. Estaba apoyado en la baranda, a escasos metros. Tenía un cigarrillo encendido y el humo te resultó ceniza volcánica en la boca, pero bajo ese olor rancio percibes lo que verdaderamente busca tu cuerpo. El aroma de su vida. La sangre caliente bajo la piel de su cuello es más embriagadora que cualquier perfume.

El muchacho no lo sabe, pero coquetea con la propia muerte.`,
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
          requirement: {
            type: "discipline",
            discipline: "dominate",
            minLevel: 1,
          },
          nextSceneId: "n1_4",
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch1_dominate_lure" },
          ],
        },
        {
          id: "n1_3_potence",
          type: "discipline",
          discipline: "potence",
          disciplineTitle: "Violencia eficiente",
          text: "No alargarlo: tomarlo por el hombro y conducirlo abajo antes de que el hambre me delate.",
          requirement: {
            type: "discipline",
            discipline: "potence",
            minLevel: 1,
          },
          nextSceneId: "n1_4",
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "humanityDelta", delta: -1 },
            { type: "setFlag", flag: "novel_ch1_force_lure" },
          ],
        },
      ],
    },
    {
      id: "n1_4",
      chapterId: "chapter01",
      title: "1.4 · Bajo el puente · El primer beso",
      text: `Allí, bajo el arco del puente, donde el agua turbia golpea las piedras, te quedas quieto.

El muchacho ni siquiera puede terminar de hablar: te lanzas contra él con una velocidad que ningún procesamiento consciente alcanza a seguir —un espasmo de violencia eficiente que lo aplastas contra el muro de piedra fría.

Hundes los dientes con desesperación salvaje.

No hay dolor para el depredador, al menos en el momento. Lo que sigue es un éxtasis seco y helado a la vez. La sangre fluye, espesa y vital, colmando el vacío de venas hasta entonces huecas.`,
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
            { type: "healthDamageDelta", delta: -5 },
            { type: "willpowerDelta", delta: 1 },
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
            { type: "healthDamageDelta", delta: -6 },
            { type: "willpowerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch1_feed_brutal" },
          ],
        },
        {
          id: "n1_4_auspex_watch",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Sombra sobre el puente",
          text: "Antes de irme, abrir el oído interior: quiero saber si alguien mira.",
          requirement: {
            type: "discipline",
            discipline: "auspex",
            minLevel: 1,
          },
          nextSceneId: "n1_end",
          effects: [{ type: "setFlag", flag: "novel_ch1_watch_sensed" }],
        },
      ],
    },
    {
      id: "n1_end",
      chapterId: "chapter01",
      title: "1.E · La mirada",
      text: `Te limpias la boca con el dorso de la mano. Te sientes poderoso, pero también irremediablemente sucio.

Alzas los ojos. Sobre el puente, una figura te observa. Inmóvil. Silenciosa. No es un humano común; tiene la misma quietud de estatua que tú acabas de estrenar en el borde del agua.

El Mapocho te ha dado el sustento, pero aquella mirada te recuerda que en la ciudad no se arranca nada gratis.`,
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
          effects: [
            { type: "setFlag", flag: "chapter_pending_chapter02" },
            { type: "setFlag", flag: "novel_ch1_hide_after_feed" },
          ],
        },
      ],
    },
  ],
};
