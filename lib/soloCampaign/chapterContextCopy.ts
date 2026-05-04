/** Texto contextual común antes de la narrativa de cada capítulo (clave = `chapterId`). */
export type SoloChapterContextBlock = {
  /**
   * Subir cuando cambie el texto: quien guarde una versión menor volverá a ver el contexto antes de ese capítulo.
   */
  contentVersion: number;
  /** Línea breve sobre el hueco tipo “Contexto • Capítulo 2”. */
  label: string;
  /** Narración impartial (segunda persona neutral) para todas las rutas/clanes. */
  body: string;
};

/**
 * Capítulos con bloque previo (“contexto”).
 * chapter01 sólo usa preludio de crónica + intro de clan; no requiere entrada aquí salvo que se decida igual.
 */
export const SOLO_CHAPTER_CONTEXT_REGISTRY: Partial<Record<string, SoloChapterContextBlock>> = {
  chapter02: {
    contentVersion: 1,
    label: "Contexto · después del Mapocho",
    body: `Después del primer Beso en el Mapocho, sigues en pie, pero ya no intacto. El hambre aflojó apenas lo justo para que la culpa vuelva a respirar. En el puente quedó una mirada inmóvil que no parecía humana: alguien te vio nacer en sangre y tomó nota.

Santiago mantiene su máscara de tráfico, humo y rutina, pero para ti la noche cambió de idioma. Ya no caminas como ciudadano: caminas como recurso potencial para quienes gobiernan desde abajo.

La Bestia no duerme; espera. Y una voz, todavía sin nombre, está a punto de citarte al centro de la ciudad.`,
  },
  chapter03: {
    contentVersion: 1,
    label: "Contexto · rastro de la hiel",
    body: `La Corte de los Espejos Rotos te dio una orden que no admite demora: bajar a la Estación Mapocho y seguir un rastro que ni los habituales del Príncipe quieren tocar.

Doña Inés ya te dejó claro que no eres invitado: eres herramienta. El sobre lacrado no trae teoría, solo trabajo sucio y margen mínimo de error.

Bajo el hierro de la estación te espera una verdad incómoda: en esta ciudad, la política de la sangre siempre termina en alcantarilla.`,
  },
  chapter04: {
    contentVersion: 1,
    label: "Contexto · del barro al archivo",
    body: `Cumpliste el encargo en los túneles, pero la victoria dejó sabor a ceniza. Cazar a uno de los tuyos para proteger un orden que te considera desechable te cambió el pulso interno.

La siguiente pista no está en un cadáver ni en una guarida: está en papel viejo, mapas coloniales y nombres que todavía mandan desde edificios de vidrio.

Si quieres entender por qué todo se está quebrando, tendrás que leer el pacto que sostiene Santiago desde antes de que se llamara Santiago.`,
  },
  chapter05: {
    contentVersion: 1,
    label: "Contexto · neón y barricada",
    body: `Los archivos te mostraron que la ciudad no es moderna: es un feudo antiguo maquillado de democracia. Y justo cuando esa verdad se asienta, la calle revienta.

Plaza Italia arde con humo, rabia y cámaras encendidas. Para alguien como tú, una multitud excitada no es solo ruido social: es hambre multiplicada.

Esta noche no te pide teoría. Te pide elegir qué parte de ti manda cuando todo alrededor está en combustión.`,
  },
  chapter06: {
    contentVersion: 1,
    label: "Contexto · invitación de seda",
    body: `Lo de la Alameda dejó huella: la calle te vio actuar, y la Corte también. En el poder inmortal, cada gesto “moral” se interpreta como costo político.

La respuesta llega en formato elegante: papel grueso, olor a lavanda y una cita sin opción real de rechazo en la Viña del Silencio.

Allí no se discute supervivencia; se negocian cadenas.`,
  },
  chapter07: {
    contentVersion: 1,
    label: "Contexto · ecos de Nod",
    body: `La copa negra te dejó algo más que náusea: te dejó visiones. Hay recuerdos que no son tuyos golpeando detrás de los ojos.

Mientras el Príncipe te quiere como embajador funcional, Gato te marca otro camino: bajar donde no llegan los rascacielos ni la narrativa oficial.

En las profundidades, la pregunta deja de ser quién manda hoy. Pasa a ser qué está despertando.`,
  },
  chapter08: {
    contentVersion: 1,
    label: "Contexto · santuario marcado",
    body: `Después del Archivista, la ciudad ya no se parece a sí misma. Cada esquina parece una costura mal hecha sobre algo mucho más viejo y hambriento.

Buscas refugio en Teatinos, pero el olor te recibe antes que la puerta: sangre fresca, metal caliente y mensaje de guerra.

Cuando te marcan la casa, te marcan el cuerpo. Y cuando te marcan el cuerpo, se acaba la neutralidad.`,
  },
  chapter09: {
    contentVersion: 1,
    label: "Contexto · la cadena en la sangre",
    body: `Perdiste el refugio y ganaste un espejo brutal: ahora sabes cómo te ven ambos bandos. El Sabat te quiere roto. El Príncipe te quiere útil.

En la periferia con Gato aparece la palabra exacta para tu malestar: Vínculo. No lealtad; química de obediencia.

Romper esa cadena no es discurso. Es hambre, costo humano y decisiones que dejan marca.`,
  },
  chapter10: {
    contentVersion: 1,
    label: "Contexto · cacería abierta",
    body: `Con el Vínculo mordiéndote la nuca, vuelves a Mapocho. Esta vez no hay margen para fingir normalidad: el Sabat salió de la sombra y convirtió la estación en vitrina de horror.

Tu cabeza tira en dos direcciones: obedecer la orden implantada o impedir que algo peor despierte.

Cuando el rito empieza, ya no peleas por bando. Peleas por si la ciudad llega entera al amanecer.`,
  },
  chapter11: {
    contentVersion: 1,
    label: "Contexto · debajo de todo",
    body: `Lo que se abrió en la cripta no cabía en ninguna estrategia de corte ni en ningún delirio sabático. Solo cabía correr.

Huyes hacia la red más vieja de Santiago: barro, metano, ladrillo colonial y comunidades que sobreviven fuera del protocolo de arriba.

Allí te espera El Choro con una oferta clásica de este mundo: información real a cambio de ensuciarte más.`,
  },
  chapter12: {
    contentVersion: 1,
    label: "Contexto · la última llave",
    body: `La llave oxidada no abre una puerta física: abre una consecuencia. Si El Choro dijo la verdad, bajo la Catedral está el nudo que sostiene tu correa con el Príncipe.

Romper ese nudo no será gratis. Nada que toque fe, sangre y memoria lo es.

Esta noche puedes ganar libertad. También puedes perder lo último que te quedaba de inocencia.`,
  },
  chapter13: {
    contentVersion: 1,
    label: "Contexto · trono de humo",
    body: `Saliste de la Catedral sin cadena, pero no sin daño. La libertad llegó acompañada de ceniza y un vacío que no se llena con victoria.

Queda un cierre pendiente: subir a Sanhattan y enfrentar al arquitecto de tu caída.

En la torre, la pregunta no será quién tiene razón. Será qué decides ser después de saber toda la verdad.`,
  },
  epilogue: {
    contentVersion: 1,
    label: "Contexto · después de la caída",
    body: `La confrontación final no apaga la ciudad ni limpia la sangre de tus manos. Solo redefine tu lugar en el tablero.

Santiago sigue funcionando para los vivos: transporte, oficinas, pantallas, olvido. Debajo, la guerra de los condenados continúa como si nada hubiese terminado.

El epílogo no cierra la noche: la vuelve hábito.`,
  },
};

export function getSoloChapterContextBlock(chapterId: string): SoloChapterContextBlock | null {
  return SOLO_CHAPTER_CONTEXT_REGISTRY[chapterId] ?? null;
}

export function isSoloChapterContextDismissed(progress: SoloChapterContextDismissable, chapterId: string): boolean {
  const block = getSoloChapterContextBlock(chapterId);
  if (!block) return true;
  const seen = progress.chapterContextSeen?.[chapterId] ?? 0;
  return seen >= block.contentVersion;
}

/** Subconjunto tipado sólo para comprobar el guardado sin importar SoloProgress completo. */
export type SoloChapterContextDismissable = {
  chapterContextSeen?: Record<string, number>;
};
