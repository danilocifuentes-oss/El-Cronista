import type { SoloChapter } from "@/lib/soloCampaign/types";

export const soloEpilogue: SoloChapter = {
  id: "epilogue",
  title: "Santiago en Cenizas · Epílogo · Cenizas al Amanecer",
  description: "La crónica del despertar termina aquí. La guerra apenas arranca.",
  startSceneId: "ne_1",
  scenes: [
    {
      id: "ne_1",
      chapterId: "epilogue",
      title: "E.1 · Letargo",
      text: `El sol comenzó a asomar por detrás de la Cordillera, tiñando fachadas de un rojo casi forense.

Se refugió en el sótano de una obra a medio sellar mientras el letargo diurno le trepaba por cervicales como sedación forzada.

La Mascarada seguía intacta para los vivos; para los condenados de abajo, la guerra apenas despertaba segunda ola.

Ya no perseguía respuestas cerradas: sólo la próxima franja nocturna donde el hambre tiene nombre propio.`,
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
