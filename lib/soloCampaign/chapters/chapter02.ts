import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter02: SoloChapter = {
  id: "chapter02",
  title: "Santiago en Cenizas · Capítulo 2 · La Corte de los Espejos Rotos",
  description:
    "Parque Forestal y un descenso a la política: Doña Inés, la corte bajo la ciudad y el primer encargo del poder.",
  startSceneId: "n2_1",
  scenes: [
    {
      id: "n2_1",
      chapterId: "chapter02",
      title: "2.1 · Parque Forestal · Sándalo y ozono",
      text: `La sangre del muchacho en el Mapocho había sido un parche, no una cura. El hambre se retira, pero la conciencia despierta, y con ella, la paranoia. Santiago, desde el nivel del río, se siente como una tumba abierta; desde arriba, es una red de luces diseñada para atrapar insectos.

Me sacudí el barro de las botas mientras subía de nuevo hacia el Parque Forestal. La figura que me observaba desde el puente ya no estaba, pero el aire había quedado cargado con el rastro de su atención: un aroma a sándalo y a ozono, el perfume de los que tienen el poder de ser invisibles.`,
      options: [
        {
          id: "n2_1_scan",
          type: "dialogue",
          text: "Caminar sin prisa, pero con la nuca alerta: alguien me midió desde arriba.",
          requirement: { type: "none" },
          nextSceneId: "n2_2",
          effects: [{ type: "setFlag", flag: "novel_ch2_forestal_alert" }],
        },
        {
          id: "n2_1_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Rastro invisible",
          text: "Abrir los sentidos y buscar el hilo del perfume, la firma de la atención.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n2_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch2_forestal_auspex_trace" }],
        },
      ],
    },
    {
      id: "n2_2",
      chapterId: "chapter02",
      title: "2.2 · Doña Inés",
      text: `—No te quedes ahí parado contemplando tu falta de juicio.

Me giré, tenso. Sentada en un banco de madera, bajo la sombra de un plátano oriental, había una mujer. Vestía un traje de sastre de una elegancia gélida. Su piel era tan pálida que bajo la luz de sodio parecía hecha de mármol pulido.

—Un recordatorio de que ya no eres dueño de tus pasos —respondió, ajustándose un guante de seda negra—. Me llaman Doña Inés. Soy la voz de aquel que gobierna esta ciudad desde las sombras. Y tú, pequeño accidente del destino, tienes una audiencia que no puedes rechazar.`,
      clanFlavor: {
        ventrue: "La autoridad reconoce autoridad. Lo odies o no, el protocolo te encuentra primero.",
        brujah: "Te arde la idea de una audiencia obligatoria. La rabia no firma citaciones.",
        toreador: "La elegancia gélida te provoca: es una estética del poder, y por eso es peligrosa.",
        malkavian: "La voz de ella no solo suena: cae como ficha en un dominó que ya estaba armado.",
      },
      options: [
        {
          id: "n2_2_listen",
          type: "dialogue",
          text: "Escuchar y seguir, porque la alternativa huele a estaca.",
          requirement: { type: "none" },
          nextSceneId: "n2_3",
          effects: [{ type: "setFlag", flag: "novel_ch2_follow_ines" }],
        },
        {
          id: "n2_2_presence",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "No mostrar debilidad",
          text: "Sostener la mirada con calma: si van a usarme, que sepan que me doy cuenta.",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "n2_3",
          effects: [{ type: "setFlag", flag: "novel_ch2_presence_stand" }],
        },
        {
          id: "n2_2_dominate",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Una pregunta obligatoria",
          text: "Forzar una respuesta mínima: «¿Quién gobierna?»",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 1 },
          nextSceneId: "n2_3",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch2_dominate_question" }],
        },
      ],
    },
    {
      id: "n2_3",
      chapterId: "chapter02",
      title: "2.3 · El descenso al centro",
      text: `Caminamos hacia el centro histórico. Santiago tiene una geografía de capas; mientras los humanos caminan sobre el asfalto de la calle Huérfanos, nosotros nos movemos por las galerías comerciales que mueren al anochecer.

Entramos por una rejilla metálica en un pasaje olvidado que Inés abrió con una llave de plata. Bajamos por pasillos de servicio y escaleras mecánicas detenidas que parecían las costillas de un animal prehistórico.`,
      options: [
        {
          id: "n2_3_down",
          type: "dialogue",
          text: "Seguir bajando. El aire cambia y con él las reglas.",
          requirement: { type: "none" },
          nextSceneId: "n2_4",
          effects: [{ type: "setFlag", flag: "novel_ch2_descent" }],
        },
        {
          id: "n2_3_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Leer el lugar",
          text: "Percibir la habitación antes de verla: quiero saber cuántos ojos me esperan.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n2_4",
          effects: [{ type: "setFlag", flag: "novel_ch2_descent_auspex" }],
        },
      ],
    },
    {
      id: "n2_4",
      chapterId: "chapter02",
      title: "2.4 · La Corte de los Espejos Rotos",
      text: `El lugar era un anacronismo. Una antigua cava de vinos reconvertida en un salón de baile barroco bajo el nivel de la calle. Candelabros de cristal colgaban del techo de ladrillo visto, y las paredes estaban cubiertas de espejos antiguos, manchados por el tiempo.

Fue allí donde noté el segundo horror de la noche: en esos espejos, los hombres y mujeres que llenaban el salón no proyectaban sombra ni reflejo.

—Mantén los ojos bajos —susurró Inés—. Aquí, una mirada prolongada es un desafío, y un desafío es una sentencia de muerte.`,
      options: [
        {
          id: "n2_4_comply",
          type: "dialogue",
          text: "Bajar la mirada. Sobrevivir primero, entender después.",
          requirement: { type: "none" },
          nextSceneId: "n2_5",
          effects: [{ type: "setFlag", flag: "novel_ch2_court_obey" }],
        },
        {
          id: "n2_4_control",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Disciplina interna",
          text: "Ordenarme calma: no regalarles el temblor.",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 1 },
          nextSceneId: "n2_5",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch2_court_control" }],
        },
      ],
    },
    {
      id: "n2_5",
      chapterId: "chapter02",
      title: "2.5 · La audiencia",
      text: `En el fondo del salón, sentado en un sillón de terciopelo que parecía un trono improvisado, estaba el hombre que mandaba. No era un guerrero, sino un tipo de aspecto burocrático, con anteojos de marco fino y una sonrisa que nunca llegaba a sus ojos.

—Así que este es el retoño de la calle Bandera —dijo—. Un nacimiento sin permiso. Una mancha de sangre en mi río. Una violación de nuestra ley más antigua: el silencio.

—Tu vida me pertenece ahora —continuó—. Tu primer encargo es simple: ve a la Estación Mapocho. Encuentra qué es lo que está asustando a las ratas, o no te molestes en buscar un refugio para el amanecer.`,
      options: [
        {
          id: "n2_5_accept",
          type: "dialogue",
          text: "Asentir. Tomar el sobre lacrado. No tengo otra jugada.",
          requirement: { type: "none" },
          nextSceneId: "n2_end",
          effects: [{ type: "setFlag", flag: "novel_ch2_mandate_accept" }],
        },
        {
          id: "n2_5_pushback",
          type: "dialogue",
          text: "Preguntar una cosa: ¿por qué yo?",
          requirement: { type: "none" },
          nextSceneId: "n2_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch2_mandate_why" }],
        },
      ],
    },
    {
      id: "n2_end",
      chapterId: "chapter02",
      title: "2.E · Política de los condenados",
      text: `Doña Inés me tomó del brazo y me condujo hacia la salida. Al pasar frente a uno de los grandes espejos manchados, vi mi propia ausencia. Ya no era un ciudadano, ni un hijo, ni un hombre. Era un arma en manos de un burócrata inmortal.

—Bienvenido a la política de los condenados —susurró Inés—. Intenta no morir dos veces en la misma noche.`,
      options: [
        {
          id: "n2_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 3",
          requirement: { type: "none" },
          nextSceneId: "n2_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter03" }],
        },
      ],
    },
  ],
};
