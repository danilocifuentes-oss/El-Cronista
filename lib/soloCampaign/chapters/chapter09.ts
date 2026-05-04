import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter09: SoloChapter = {
  id: "chapter09",
  title: "Santiago en Cenizas · Capítulo 9 · El Vínculo que Quema",
  description:
    "Periferia sur: refugio de toma, hambre humilde y la revelación del Vínculo como correa de sangre.",
  startSceneId: "n9_1",
  scenes: [
    {
      id: "n9_1",
      chapterId: "chapter09",
      title: "9.1 · Toma · Correa de perro",
      text: `El refugio de Gato no era una casona ni un sótano señorial. Era una toma en la periferia. Aquí, la sangre no era un lujo: era un recurso desesperado.

—Esa copa que bebiste no era un sello diplomático —dijo Gato—. Era una correa de perro.`,
      options: [
        {
          id: "n9_1_accept_truth",
          type: "dialogue",
          text: "Aceptar la verdad: me encadenaron y yo tragué la cadena.",
          requirement: { type: "none" },
          nextSceneId: "n9_2",
          effects: [{ type: "setFlag", flag: "novel_ch9_bond_known" }],
        },
        {
          id: "n9_1_deny",
          type: "dialogue",
          text: "Negarlo un segundo, solo para sentir el asco después.",
          requirement: { type: "none" },
          nextSceneId: "n9_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch9_bond_deny" }],
        },
      ],
    },
    {
      id: "n9_2",
      chapterId: "chapter09",
      title: "9.2 · Alimentarse sin perderse",
      text: `Gato señaló a un hombre dormido. “Es un voluntario”, dijo. “No lo mates”.\n\nNecesitaba alimentarme. Pero aquí, en el barro, la decencia era la última frontera.`,
      options: [
        {
          id: "n9_2_feed_gentle",
          type: "dialogue",
          text: "Beber con delicadeza. No matarlo. No convertirme en lo que me quieren.",
          requirement: { type: "none" },
          nextSceneId: "n9_end",
          effects: [{ type: "hungerDelta", delta: -2 }, { type: "humanityDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch9_feed_gentle" }],
        },
        {
          id: "n9_2_feed_deep",
          type: "dialogue",
          text: "Beber más de lo que debería. La Bestia manda un poco.",
          requirement: { type: "none" },
          nextSceneId: "n9_end",
          effects: [{ type: "hungerDelta", delta: -3 }, { type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch9_feed_deep" }],
        },
      ],
    },
    {
      id: "n9_end",
      chapterId: "chapter09",
      title: "9.E · La decisión",
      text: `El Vínculo seguía ahí: una presión constante en la base del cráneo, ordenando obediencia.\n\n—Mañana iremos a la Estación Mapocho de nuevo —dije—. Pero no iré como embajador del Príncipe.`,
      options: [
        {
          id: "n9_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 10",
          requirement: { type: "none" },
          nextSceneId: "n9_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter10" }],
        },
      ],
    },
  ],
};
