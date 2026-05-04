import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter03: SoloChapter = {
  id: "chapter03",
  title: "Santiago en Cenizas · Capítulo 3 · El Rastro de la Hiel",
  description:
    "La Estación Mapocho como mausoleo: túneles, El Choro y el primer choque directo con algo que ya no sigue reglas.",
  startSceneId: "n3_1",
  scenes: [
    {
      id: "n3_1",
      chapterId: "chapter03",
      title: "3.1 · Estación Mapocho · Entrada de servicio",
      text: `La Estación Mapocho se alzaba ante él como un mausoleo de hierro y cristal. Antaño había sido el corazón ferroviario de un país que soñaba con el progreso; hoy, centro cultural que bajo la luna recuperaba aire de terminal para pasajeros que nunca llegan.

El sobre que Doña Inés le había entregado contenía una sola instrucción: “Sigue el rastro de la hiel”.`,
      options: [
        {
          id: "n3_1_enter",
          type: "dialogue",
          text: "Bajar. El aire húmedo huele a cable quemado y río.",
          requirement: { type: "none" },
          nextSceneId: "n3_2",
          effects: [{ type: "setFlag", flag: "novel_ch3_enter_tunnels" }],
        },
        {
          id: "n3_1_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Hilo de hiel",
          text: "Rastrear el rastro antes de cruzar la puerta: quiero saber si ya soy presa.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n3_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch3_auspex_trace" }],
        },
      ],
    },
    {
      id: "n3_2",
      chapterId: "chapter03",
      title: "3.2 · El Choro",
      text: `—¿Sientes eso, recién nacido?

La voz surgió de la oscuridad absoluta. El olor era inconfundible: alcantarilla, humedad rancia y descomposición química.

—Me llaman "El Choro" —dijo—. Y si das un paso más, vas a pisar algo que no querrás limpiar de tus botas.`,
      clanFlavor: {
        malkavian: "Para él, el hedor traza patrones: la ciudad firma en mugre cuando se le niega tinta.",
        ventrue:
          "El provocador bajo tierra lleva información en la burla: quien manda también aquí apesta a verdadero poder.",
      },
      options: [
        {
          id: "n3_2_question",
          type: "dialogue",
          text: "Exigir una respuesta: ¿qué hay ahí abajo?",
          requirement: { type: "none" },
          nextSceneId: "n3_3",
          effects: [{ type: "setFlag", flag: "novel_ch3_ask_choro" }],
        },
        {
          id: "n3_2_presence",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "No soy carne fácil",
          text: "Imponerme sin gritar: que entienda que no vine a suplicar.",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "n3_3",
          effects: [{ type: "setFlag", flag: "novel_ch3_presence_stand" }],
        },
      ],
    },
    {
      id: "n3_3",
      chapterId: "chapter03",
      title: "3.3 · El encuentro",
      text: `El boquete en la pared parecía abierto a dentelladas; al otro lado, una cámara de mantenimiento sepultada.

Había restos humanos sin el pulido de mesa quirúrgica: carne desarticulada, líquido disperso sobre hormigón.

En el centro, agachada sobre un bulto irreconocible, la criatura endureció cada músculo; giró sobre sí y rugió contra el intruso.`,
      options: [
        {
          id: "n3_3_fight",
          type: "dialogue",
          text: "Enfrentarla. No hay negociación aquí.",
          requirement: { type: "none" },
          nextSceneId: "n3_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch3_fight" }],
        },
        {
          id: "n3_3_potence",
          type: "discipline",
          discipline: "potence",
          disciplineTitle: "Romper para sobrevivir",
          text: "Usar fuerza brutal para incapacitarla de una vez.",
          requirement: { type: "discipline", discipline: "potence", minLevel: 1 },
          nextSceneId: "n3_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch3_potence_finish" }],
        },
      ],
    },
    {
      id: "n3_end",
      chapterId: "chapter03",
      title: "3.E · Regusto amargo",
      text: `Había cumplido la misión, pero el triunfo sabía a ceniza volcánica: había cazado uno de los suyos para salvar orden que apenas lo tratara como recurso despachable.

—Bien hecho, pequeño activo —susurró El Choro desde la oscuridad—. Ya sabes a qué sabe traicionar.`,
      options: [
        {
          id: "n3_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 4",
          requirement: { type: "none" },
          nextSceneId: "n3_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter04" }],
        },
      ],
    },
  ],
};
