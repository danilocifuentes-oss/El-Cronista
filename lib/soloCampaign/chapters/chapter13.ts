import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Narración en segunda persona. */
export const chapter13: SoloChapter = {
  id: "chapter13",
  title: "Santiago en Cenizas · Capítulo 13 · El Trono de Humo",
  description:
    "Sanhattan como espejismo: la Gran Torre, el Príncipe y la verdad del experimento. Caer no es morir: es escoger sombra.",
  startSceneId: "n13_1",
  scenes: [
    {
      id: "n13_1",
      chapterId: "chapter13",
      title: "13.1 · Sanhattan",
      text: `Sanhattan jamás fue ciudad entera: bloque de vidrio y promesas que se doblan como espejismo.

El hueco en el pecho —donde antes ardía vínculo obediente— resonaba ahora como pozo sin eco útil.`,
      options: [
        {
          id: "n13_1_go_tower",
          type: "dialogue",
          text: "Ir a la Gran Torre. Mirarlo a la cara.",
          requirement: { type: "none" },
          nextSceneId: "n13_2",
          effects: [{ type: "setFlag", flag: "novel_ch13_tower" }],
        },
        {
          id: "n13_1_wait",
          type: "dialogue",
          text: "Dudar un segundo y caminar igual. Ya no queda inocencia que proteger.",
          requirement: { type: "none" },
          nextSceneId: "n13_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch13_doubt" }],
        },
      ],
    },
    {
      id: "n13_2",
      chapterId: "chapter13",
      title: "13.2 · Helipuerto",
      text: `El Príncipe estaba allí, revisando gráficos como si el destino se midiera en dividendos.

—Nunca fuiste mi herramienta —dijo—. Fuiste un experimento de control de daños.

Te convertimos en un filtro.`,
      options: [
        {
          id: "n13_2_attack",
          type: "dialogue",
          text: "Atacar. Dejar que la Bestia hable por mí.",
          requirement: { type: "none" },
          nextSceneId: "n13_end",
          effects: [{ type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch13_attack" }],
        },
        {
          id: "n13_2_refuse_throne",
          type: "dialogue",
          text: "No quiero tu trono. No quiero tu ciudad.",
          requirement: { type: "none" },
          nextSceneId: "n13_end",
          effects: [{ type: "setFlag", flag: "novel_ch13_refuse" }],
        },
      ],
    },
    {
      id: "n13_end",
      chapterId: "chapter13",
      title: "13.E · Caída",
      text: `Te dejas caer: no hacia la muerte —esa ya había timbrado entrada— sino hacia sombra operativa.

Ya no eres filtro, embajador ni activo contable.

Persistes como rumor en engranaje santiaguino que nadie quiere auditar.`,
      options: [
        {
          id: "n13_end_continue",
          type: "dialogue",
          text: "Ir al Epílogo",
          requirement: { type: "none" },
          nextSceneId: "n13_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_epilogue" }],
        },
      ],
    },
  ],
};
