import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Narración en segunda persona. */
export const chapter06: SoloChapter = {
  id: "chapter06",
  title: "Santiago en Cenizas · Capítulo 6 · La Máscara del Diplomático",
  description:
    "La Viña del Silencio: etiqueta, sumilleres de sangre y el primer sello que huele a cadena.",
  startSceneId: "n6_1",
  scenes: [
    {
      id: "n6_1",
      chapterId: "chapter06",
      title: "6.1 · La invitación",
      text: `El cobro te llegó como invitación sobre papel grueso, color crema, con letra impresa que no pedía permiso: “Vístete para una cena. El Príncipe requiere presencia en la Viña del Silencio”.`,
      options: [
        {
          id: "n6_1_go",
          type: "dialogue",
          text: "Ir. La negativa no es una opción real.",
          requirement: { type: "none" },
          nextSceneId: "n6_2",
          effects: [{ type: "setFlag", flag: "novel_ch6_invite_accept" }],
        },
        {
          id: "n6_1_resist",
          type: "dialogue",
          text: "Considerar huir (solo un segundo) y tragar el impulso.",
          requirement: { type: "none" },
          nextSceneId: "n6_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch6_invite_resist" }],
        },
      ],
    },
    {
      id: "n6_2",
      chapterId: "chapter06",
      title: "6.2 · Mesa larga · Copas rojas",
      text: `En el patio central, una mesa larga de roble estaba dispuesta para una cena de etiqueta. En los platos no había comida, sino copas de cristal con diferentes tonalidades de rojo.

—Hoy no celebramos la supervivencia, sino la diplomacia —dijo el Príncipe.`,
      options: [
        {
          id: "n6_2_observe",
          type: "dialogue",
          text: "Observar. Aprender nombres sin pedirlos.",
          requirement: { type: "none" },
          nextSceneId: "n6_3",
          effects: [{ type: "setFlag", flag: "novel_ch6_table_observe" }],
        },
        {
          id: "n6_2_presence",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "Etiqueta con filo",
          text: "Hacerme notar sin romper protocolo: que sepan que me acuerdo de cada mirada.",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "n6_3",
          effects: [{ type: "setFlag", flag: "novel_ch6_presence_table" }],
        },
      ],
    },
    {
      id: "n6_3",
      chapterId: "chapter06",
      title: "6.3 · La copa negra",
      text: `Doña Inés apareció con una bandeja de plata. Una sola copa pequeña, de cristal negro. El aroma era pesado, amargo, con un matiz a tierra vieja.

—Bebe —ordenó el Príncipe—. Es un sello.`,
      options: [
        {
          id: "n6_3_drink",
          type: "dialogue",
          text: "Beber. Sobrevivir hoy, pagar después.",
          requirement: { type: "none" },
          nextSceneId: "n6_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch6_black_cup" }],
        },
        {
          id: "n6_3_dominate",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Demorar el golpe",
          text: "Pedir un minuto con voz que no admite réplica. No salvará mi cuello, pero salva mi dignidad.",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 1 },
          nextSceneId: "n6_end",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "novel_ch6_black_cup_delay" }],
        },
      ],
    },
    {
      id: "n6_end",
      chapterId: "chapter06",
      title: "6.E · Marca en las venas",
      text: `Abandonas la Viña del Silencio con esa gravedad nueva en el torso —alma o estómago, mismo contrapeso. Santiago seguía alumbrada arriba y abajo, sólo que ahora llevas marca doble bajo la piel: sello de amo y sombra de segundo dueño.`,
      options: [
        {
          id: "n6_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 7",
          requirement: { type: "none" },
          nextSceneId: "n6_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter07" }],
        },
      ],
    },
  ],
};
