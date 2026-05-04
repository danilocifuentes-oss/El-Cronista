import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Narración en segunda persona. */
export const chapter04: SoloChapter = {
  id: "chapter04",
  title: "Santiago en Cenizas · Capítulo 4 · Archivos Desenterrados",
  description:
    "La Biblioteca Nacional como osario de secretos: el hombre de los dedos amarillos y el pacto que huele a azufre.",
  startSceneId: "n4_1",
  scenes: [
    {
      id: "n4_1",
      chapterId: "chapter04",
      title: "4.1 · La Biblioteca Nacional",
      text: `La Biblioteca Nacional guarda más que libros: el rastro de la hiel no termina en sangre fresca sino en tinta vieja.

En la Sala de Investigadores, tras un escritorio de roble, un hombre de dedos amarillentos por el tabaco te aguardaba con carpeta cerrada.`,
      options: [
        {
          id: "n4_1_ask",
          type: "dialogue",
          text: "Pedir los registros de la Estación Mapocho.",
          requirement: { type: "none" },
          nextSceneId: "n4_2",
          effects: [{ type: "setFlag", flag: "novel_ch4_request_files" }],
        },
        {
          id: "n4_1_dominate",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "No es una conversación",
          text: "Forzarlo a entregar el cartapacio sin más preámbulos.",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 2 },
          nextSceneId: "n4_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch4_dominate_files" }],
        },
      ],
    },
    {
      id: "n4_2",
      chapterId: "chapter04",
      title: "4.2 · El pacto",
      text: `—Santiago no se fundó sobre tierra virgen —susurró el hombre—; se fundó sobre un pacto que huele a azufre y a vino agrio.

Mapas antiguos, marcas rojas y nombres de linajes que aún resuenan en directorios y clubes.`,
      options: [
        {
          id: "n4_2_read",
          type: "dialogue",
          text: "Memorizar nombres y símbolos. Entender la red.",
          requirement: { type: "none" },
          nextSceneId: "n4_end",
          effects: [{ type: "setFlag", flag: "novel_ch4_symbols" }],
        },
        {
          id: "n4_2_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Tinta con olor ferroso",
          text: "Leer lo que el papel no dice: la intención detrás de la marca.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n4_end",
          effects: [{ type: "setFlag", flag: "novel_ch4_auspex_intent" }],
        },
      ],
    },
    {
      id: "n4_end",
      chapterId: "chapter04",
      title: "4.E · Sombras en la sala",
      text: `Un ruido de pasos elegantes rompió el silencio. Doña Inés estaba allí.

—Has leído suficiente —dijo—. Esta ciudad jamás fue tablero nuevo; es partida abierta desde hace siglos sin tablas firmes.`,
      options: [
        {
          id: "n4_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 5",
          requirement: { type: "none" },
          nextSceneId: "n4_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter05" }],
        },
      ],
    },
  ],
};
