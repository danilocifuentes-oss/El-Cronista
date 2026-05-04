import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter12: SoloChapter = {
  id: "chapter12",
  title: "Santiago en Cenizas · Capítulo 12 · La última noche del sol",
  description:
    "Plaza de Armas y Catedral: el osario oculto, el relicario de plata y el precio brutal de romper cadenas.",
  startSceneId: "n12_1",
  scenes: [
    {
      id: "n12_1",
      chapterId: "chapter12",
      title: "12.1 · Plaza de Armas · La Catedral",
      text: `Salir de las alcantarillas a la Plaza de Armas fue como emerger de una tumba.\n\nLa Catedral Metropolitana se alzaba frente a mí, una fortaleza diseñada para proteger al hombre de Dios… o para proteger a Dios de lo que nosotros nos habíamos convertido.`,
      options: [
        {
          id: "n12_1_enter",
          type: "dialogue",
          text: "Entrar. La llave pesa como una sentencia.",
          requirement: { type: "none" },
          nextSceneId: "n12_2",
          effects: [{ type: "setFlag", flag: "novel_ch12_enter_cathedral" }],
        },
        {
          id: "n12_1_brujah",
          type: "clan",
          clan: "brujah",
          text: "Entrar igual, aunque el incienso me revuelva el odio: no le debo pureza a nadie.",
          requirement: { type: "clan", clan: "brujah" },
          nextSceneId: "n12_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch12_brujah_defy" }],
        },
      ],
    },
    {
      id: "n12_2",
      chapterId: "chapter12",
      title: "12.2 · La cripta",
      text: `Bajé hacia la cripta. La llave de bronce encajó. El suelo se desplazó.\n\nNo había huesos: había un sarcófago de cristal y plomo.\n\nDentro, un relicario: una vasija de plata con sangre que no era humana. Era voluntad.`,
      options: [
        {
          id: "n12_2_break",
          type: "dialogue",
          text: "Romperlo. Ser libre aunque me vacíe por dentro.",
          requirement: { type: "none" },
          nextSceneId: "n12_end",
          effects: [{ type: "humanityDelta", delta: -2 }, { type: "setFlag", flag: "novel_ch12_break_relic" }],
        },
        {
          id: "n12_2_hesitate",
          type: "dialogue",
          text: "Dudar. El precio huele a profanación.",
          requirement: { type: "none" },
          nextSceneId: "n12_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch12_hesitate" }],
        },
      ],
    },
    {
      id: "n12_end",
      chapterId: "chapter12",
      title: "12.E · Ceniza",
      text: `El muchacho del Mapocho estaba allí. Mi primera víctima.\n\nPara romper el Vínculo, tuve que terminar lo que empecé.\n\nCuando el dolor cesó, él era ceniza.\n\nY yo… yo estaba solo.`,
      options: [
        {
          id: "n12_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 13",
          requirement: { type: "none" },
          nextSceneId: "n12_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter13" }],
        },
      ],
    },
  ],
};
