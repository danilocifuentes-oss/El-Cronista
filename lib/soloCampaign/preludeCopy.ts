import type { ClanId } from "@/lib/character";

/** Incrementar cuando cambie el texto del preludio: quien tenga valor menor volverá a ver la cortina antes de clan. */
export const CHRONICLE_PRELUDE_CONTENT_VERSION = 5;

/** Preludio diegético común antes de la intro de clan; versión efectiva vs `chroniclePreludeSeenVersion` en el save. Narración en segunda persona (omnisciente → tú). */
export const CHRONICLE_PRELUDE_COMMON = `La lluvia cae sobre Santiago como si el cielo estuviera vomitando sus pecados.
Ya no respiras.
Y sin embargo, nunca habías sentido el aire con tanta claridad.

Abres los ojos en la oscuridad. El cuerpo te pesa de una forma extraña: es tuyo, pero ya no te pertenece del todo. La sangre que corre por tus venas es vieja, prestada, maldita. La Bestia, esa otra cosa que ahora vive dentro de ti, se despereza lentamente y te susurra con voz casi cariñosa:

"Bienvenido a la eternidad, neonato. Duele, ¿verdad? Eso es bueno. El dolor significa que aún no estás muerto del todo."

Solo te quedan fragmentos. Una boca en el cuello. Unos ojos que miraban como quien admira una obra de arte condenada. Un susurro final:

"Ahora eres nuestro. Intenta no romperte demasiado pronto."

Te incorporas. La ciudad al otro lado de las paredes respira, late, vigila. Cámaras, algoritmos, patrullas de la Segunda Inquisición, ojos mortales que ya no son tan ciegos como antes. La Máscara te espera. Esa frágil mentira que tendrás que mantener cada noche para que los vivos no descubran al monstruo que ahora habita tu piel.

Porque eso es lo que eres ahora:

Un depredador elegante.
Un artista maldito.
Un noble en ruinas.
Un loco que ve demasiado.
Un animal rabioso.
Un erudito hambriento.
Un paria que nadie quiere mirar dos veces.

Todos diferentes.
Todos condenados por la misma sangre.

Esta es tu segunda oportunidad.
Y duele como solo duele la inmortalidad.

La lluvia sigue cayendo.
La Bestia sonríe dentro de tu pecho.
Y Santiago de Chile, con sus luces frías y sus sombras profundas, te espera para devorarte… o para ser devorada por ti.`;
/** Un latigazo tonal por clan (solo los disponibles en solitario tienen entrada). */
export const CHRONICLE_PRELUDE_MASK_STINGER: Partial<Record<ClanId, string>> = {
  brujah:
    "Tu máscara se parece demasiado a la rabia legitimada… y eso enamora tribunales tanto como compañías de seguridad.",
  ventrue:
    "Tu máscara es soberanía amortiguada — la calma cara que permite negociar aunque dentro quede el sótano todavía húmedo.",
  toreador:
    "Tu máscara interpreta tanto el esplendor cuanto la catástrofe; el público de primera fila eres tú mismo, aplaudiendo hasta romperse.",
  malkavian:
    "Tu máscara es el ruido ordenado: nadie oye el patrón igual, y eso te vuelve sospecha indispensable o error de sistema.",
};
