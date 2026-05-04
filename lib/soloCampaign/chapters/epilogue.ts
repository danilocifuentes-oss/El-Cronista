import type { SoloChapter } from "@/lib/soloCampaign/types";

export const soloEpilogue: SoloChapter = {
  id: "epilogue",
  title: "Santiago en Cenizas · Epílogo · Cenizas al Amanecer",
  description: "La crónica de mi despertar termina. La guerra recién comienza.",
  startSceneId: "ne_1",
  scenes: [
    {
      id: "ne_1",
      chapterId: "epilogue",
      title: "E.1 · Letargo",
      text: `El sol comenzó a asomar por detrás de la Cordillera, pintando de rojo sangriento las fachadas.

Me refugié en el sótano de una construcción a medio terminar, sintiendo cómo el letargo me reclamaba.

La Mascarada seguía intacta para los vivos, pero para nosotros, los condenados, la guerra apenas estaba comenzando.

Ya no buscaba respuestas. Ahora, simplemente, buscaba la noche.`,
      options: [
        {
          id: "ne_1_end",
          type: "dialogue",
          text: "Cerrar (volver al Nexo)",
          requirement: { type: "none" },
          nextSceneId: "ne_1",
          effects: [{ type: "setFlag", flag: "novel_epilogue_complete" }],
        },
      ],
    },
  ],
};
