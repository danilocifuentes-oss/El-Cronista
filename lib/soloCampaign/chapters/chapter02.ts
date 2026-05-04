import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Capítulo 2 — narración en segunda persona. */
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
      text: `La sangre del humano del Mapocho había sido un parche, no una cura. El hambre se retira, pero la conciencia despierta con la paranoia. Santiago, visto desde el nivel del río, sugiere tumba abierta; desde las barandas parece una red de luces diseñada para atrapar insectos.

Sacudes el barro de las botas al retornar al Parque Forestal. La figura que te vigilara desde el puente ya no está allí arriba, pero el rastro de esa atención sigue en el aire: un aroma de sándalo y ozono, el perfume de quien tiene el poder de volverse invisible.`,
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
          requirement: {
            type: "discipline",
            discipline: "auspex",
            minLevel: 1,
          },
          nextSceneId: "n2_2",
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch2_forestal_auspex_trace" },
          ],
        },
      ],
    },
    {
      id: "n2_2",
      chapterId: "chapter02",
      title: "2.2 · Doña Inés",
      text: `—No te quedes ahí parado contemplando tu falta de juicio.

Te giras tenso. En un banco de madera, bajo la sombra de un plátano oriental, hay una mujer vestida en traje de sastre de elegancia casi médica; su piel tan pálida que bajo la luz de sodio parece mármol pulido.

—Un recordatorio de que ya no eres dueño de tus pasos —responde, ajustándose el guante de seda—. Me llaman Doña Inés. Soy la voz de quien gobierna esta ciudad desde las sombras. Y tú, pequeño accidente del destino, tienes una audiencia que no puedes rechazar.`,
      clanFlavor: {
        ventrue:
          "El protocolo te duele menos cuando reconoces trono aunque esté oculto; la autoridad sabe igual de fría llamarse Inés.",
        brujah: "La idea de audiencia obligatoria te raspa los nervios como lima: tu rabia no firma citaciones.",
        toreador:
          "Aquella elegancia gélida te fascina tanto como te horroriza: es estética de poder —y por tanto te hiere.",
        malkavian:
          "La frase cae ordenada, pero te suena incompleta, como fichas que caen antes de verse el dominó.",
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
          requirement: {
            type: "discipline",
            discipline: "presence",
            minLevel: 1,
          },
          nextSceneId: "n2_3",
          effects: [{ type: "setFlag", flag: "novel_ch2_presence_stand" }],
        },
        {
          id: "n2_2_dominate",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Una pregunta obligatoria",
          text: "Forzar una respuesta mínima: «¿Quién gobierna?»",
          requirement: {
            type: "discipline",
            discipline: "dominate",
            minLevel: 1,
          },
          nextSceneId: "n2_3",
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch2_dominate_question" },
          ],
        },
      ],
    },
    {
      id: "n2_3",
      chapterId: "chapter02",
      title: "2.3 · El descenso al centro",
      text: `Doña Inés te conduce hacia el centro histórico; Santiago muestra dos geografías paralelas: el asfalto oficial y las galerías que muerden cuando cae la noche.

Cruzas una rejilla metálica en un pasaje olvidado; ella extrae una llave plateada como quien muestra relicario oficial. Bajas con ella por pasillos de servicio y escaleras mecánicas paradas, cadáveres de infraestructura que parecen costillas fósiles.`,
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
          requirement: {
            type: "discipline",
            discipline: "auspex",
            minLevel: 1,
          },
          nextSceneId: "n2_4",
          effects: [{ type: "setFlag", flag: "novel_ch2_descent_auspex" }],
        },
      ],
    },
    {
      id: "n2_4",
      chapterId: "chapter02",
      title: "2.4 · La Corte de los Espejos Rotos",
      text: `El salón aparece ajeno a todo calendario: antigua cueva de barriles reconvertida en salón donde el tiempo se encoge bajo el nivel de las calles. Candelabros de cristal cuelgan de ladrillo a la vista. Los espejos viejos, manchados, devuelven luz sospechosamente nueva.

Aquí cae sobre ti otro vértigo: en esos cristales los reunidos apenas tienen volumen corpóreo —ni sombras que los delaten cuando debieran tenerlas.

—Mantén los ojos bajos —musita Doña Inés—. Aquí prolongar la mirada es desafío, y el desafío es sentencia.`,
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
          requirement: {
            type: "discipline",
            discipline: "dominate",
            minLevel: 1,
          },
          nextSceneId: "n2_5",
          effects: [
            { type: "hungerDelta", delta: -1 },
            { type: "setFlag", flag: "novel_ch2_court_control" },
          ],
        },
      ],
    },
    {
      id: "n2_5",
      chapterId: "chapter02",
      title: "2.5 · La audiencia",
      text: `En el fondo del salón, sentado en un sillón de terciopelo que parece trono provisional, espera quien decide la política vampírica: no cara de duelista, más bien de escritorio ancestral, anteojos de marcas finísimas, sonrisa que se detiene media curva antes de llegar al brillo esperado del ojo.

—Así que este es el retoño de la calle Bandera —dice—. Un nacimiento sin permiso. Una mancha de sangre en mi río. Una violación de nuestra ley más antigua: el silencio.

—Tu vida me pertenece ahora —continúa—. Tu primer encargo es simple: ve a la Estación Mapocho. Encuentra qué es lo que está asustando a las ratas, o no te molestes en buscar un refugio para el amanecer.`,
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
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "novel_ch2_mandate_why" },
          ],
        },
      ],
    },
    {
      id: "n2_end",
      chapterId: "chapter02",
      title: "2.E · Política de los condenados",
      text: `Doña Inés te toma el brazo y te guía hasta la puerta trasera sin pasacalles ceremoniales de más. Cruzas ante espejos manchados; en el último ves solo un hueco donde un hombre debería estar: ya ni reconoces al ciudadano perdido bajo ese vacío líquido, arma apenas ensamblada en despacho vampírico de burocracia milenaria.

—Bienvenido a la política de los condenados —susurra Inés sin volver la cabeza—. Intenta no morir dos veces esta misma noche.`,
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
