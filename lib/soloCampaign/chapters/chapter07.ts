import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Narración en segunda persona. */
export const chapter07: SoloChapter = {
  id: "chapter07",
  title: "Santiago en Cenizas · Capítulo 7 · Ecos de la Tierra de Nod",
  description:
    "Un descenso al olvido: túneles coloniales, el Archivista y visiones que huelen a Gehena.",
  startSceneId: "n7_1",
  scenes: [
    {
      id: "n7_1",
      chapterId: "chapter07",
      title: "7.1 · Quinta Normal · Entrada al olvido",
      text: `La sangre negra bebida en la Viña seguía pulsando en ti como metrónomo invertido. Gato aguardaba sin prisa con consigna clara: abandonar el consuelo vertical de los edificios fundidos con luz LED y bajar al tramo que ni siquiera registra mapas de consumo eléctrico.`,
      options: [
        {
          id: "n7_1_down",
          type: "dialogue",
          text: "Bajar a los túneles pluviales. No hay respuestas arriba.",
          requirement: { type: "none" },
          nextSceneId: "n7_2",
          effects: [{ type: "setFlag", flag: "novel_ch7_enter_cistern" }],
        },
        {
          id: "n7_1_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Memoria en sangre",
          text: "Seguir la intuición que susurra desde la sangre negra.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n7_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch7_blood_memory" }],
        },
      ],
    },
    {
      id: "n7_2",
      chapterId: "chapter07",
      title: "7.2 · La biblioteca del caos",
      text: `Una bóveda circular: papeles y recortes unidos por lana roja. En el centro, sobre una montaña de libros deshechos, un hombre de ojos demasiado lúcidos.

Se presentó como “El Archivista”.`,
      options: [
        {
          id: "n7_2_listen",
          type: "dialogue",
          text: "Escuchar su red. Dejar que el caos se explique a sí mismo.",
          requirement: { type: "none" },
          nextSceneId: "n7_end",
          effects: [{ type: "setFlag", flag: "novel_ch7_archivist_listen" }],
        },
        {
          id: "n7_2_malk",
          type: "clan",
          clan: "malkavian",
          text: "Responder como si el mapa ya estuviera en mi cabeza: seguir el patrón sin pedir permiso.",
          requirement: { type: "clan", clan: "malkavian" },
          nextSceneId: "n7_end",
          effects: [{ type: "setFlag", flag: "novel_ch7_malk_resonance" }],
        },
      ],
    },
    {
      id: "n7_end",
      chapterId: "chapter07",
      title: "7.E · Advertencia",
      text: `Las señales estaban allí. El tiempo viejo de Nod volvía a contar en el aire viciado.

Sales con los ejes internos descalibrados: por primera vez esa hambre no te pide sangre de cuello sino certeza suficiente como escudo frente a la tormenta nocturna anunciada.`,
      options: [
        {
          id: "n7_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 8",
          requirement: { type: "none" },
          nextSceneId: "n7_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter08" }],
        },
      ],
    },
  ],
};
