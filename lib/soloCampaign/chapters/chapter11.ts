import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Narración en segunda persona. */
export const chapter11: SoloChapter = {
  id: "chapter11",
  title: "Santiago en Cenizas · Capítulo 11 · Descenso al Alcantarillado",
  description:
    "Huir hacia abajo: bóvedas coloniales, 'ratas' y El Choro ofreciendo un tercer camino con precio.",
  startSceneId: "n11_1",
  scenes: [
    {
      id: "n11_1",
      chapterId: "chapter11",
      title: "11.1 · Bajo Santiago",
      text: `El frío que emanaba de la cripta no era sólo temperatura: pesaba como plomo encima del esternón.\n\nHuyes empujado por tubería pluvial apenas ancha; bajo las suelas de Santiago existe otra urbe hecha de fugas y ecos.`,
      options: [
        {
          id: "n11_1_follow_marks",
          type: "dialogue",
          text: "Seguir las marcas de tiza fluorescente. Confiar en quien sabe la oscuridad.",
          requirement: { type: "none" },
          nextSceneId: "n11_2",
          effects: [{ type: "setFlag", flag: "novel_ch11_marks" }],
        },
        {
          id: "n11_1_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Peso en la humedad",
          text: "Percibir lo que se mueve entre paredes: no quiero sorpresas en el barro.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n11_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch11_auspex" }],
        },
      ],
    },
    {
      id: "n11_2",
      chapterId: "chapter11",
      title: "11.2 · El reino de las ratas",
      text: `Figuras emergieron de la bóveda. Habían renunciado a parecer humanos.\n\nEn el centro estaba El Choro, ahora un rey en su trono de desperdicios.\n\n—¿Quieres ser libre de la seda y el mármol? —susurró—.`,
      options: [
        {
          id: "n11_2_trade",
          type: "dialogue",
          text: "Aceptar el trueque: información por libertad futura.",
          requirement: { type: "none" },
          nextSceneId: "n11_end",
          effects: [{ type: "setFlag", flag: "novel_ch11_trade" }],
        },
        {
          id: "n11_2_refuse",
          type: "dialogue",
          text: "Negarme. No firmar pactos en la mugre (aunque ya esté dentro).",
          requirement: { type: "none" },
          nextSceneId: "n11_end",
          effects: [{ type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch11_refuse" }],
        },
      ],
    },
    {
      id: "n11_end",
      chapterId: "chapter11",
      title: "11.E · La llave",
      text: `El Choro extendió una mano deforme. En su palma: una llave de bronce oxidada.\n\n—Llévala a la cripta bajo la Catedral —dijo—. Si la encuentras, el Vínculo se romperá.`,
      options: [
        {
          id: "n11_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 12",
          requirement: { type: "none" },
          nextSceneId: "n11_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter12" }, { type: "setFlag", flag: "novel_ch11_key_taken" }],
        },
      ],
    },
  ],
};
