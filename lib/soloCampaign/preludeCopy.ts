import type { ClanId } from "@/lib/character";

/** Incrementar cuando cambie el texto del preludio: quien tenga valor menor volverá a ver la cortina antes de clan. */
export const CHRONICLE_PRELUDE_CONTENT_VERSION = 4;

/** Preludio diegético común antes de la intro de clan; versión efectiva vs `chroniclePreludeSeenVersion` en el save. Narración en tercera persona (él / el neonato). */
export const CHRONICLE_PRELUDE_COMMON = `La lluvia cae sobre Santiago como si el cielo estuviera vomitando sus pecados.
El neonato ya no respira.
Y sin embargo, nunca había sentido el aire con tanta claridad.

Abrió los ojos en la oscuridad. El cuerpo le pesa de una forma extraña: es suyo, pero ya no le pertenece del todo. La sangre que corre por sus venas es vieja, prestada, maldita. La Bestia, esa otra cosa que ahora vive dentro de él, se despereza lentamente y le susurra con voz casi cariñosa:

"Bienvenido a la eternidad, neonato. Duele, ¿verdad? Eso es bueno. El dolor significa que aún no estás muerto del todo."

Solo le quedaban fragmentos. Una boca en el cuello. Unos ojos que miraban como quien admira una obra de arte condenada. Un susurro final:

"Ahora eres nuestro. Intenta no romperte demasiado pronto."

Se incorpora. La ciudad al otro lado de las paredes respira, late, vigila. Cámaras, algoritmos, patrullas de la Segunda Inquisición, ojos mortales que ya no son tan ciegos como antes. La Máscara lo espera. Esa frágil mentira que tendrá que mantener cada noche para que los vivos no descubran al monstruo que ahora habita su piel.

Porque eso es lo que es ahora:

Un depredador elegante.
Un artista maldito.
Un noble en ruinas.
Un loco que ve demasiado.
Un animal rabioso.
Un erudito hambriento.
Un paria que nadie quiere mirar dos veces.

Todos diferentes.
Todos condenados por la misma sangre.

Esta es su segunda oportunidad.
Y duele como solo duele la inmortalidad.

La lluvia sigue cayendo.
La Bestia sonríe dentro del pecho del neonato.
Y Santiago de Chile, con sus luces frías y sus sombras profundas, lo espera para devorarlo… o para ser devorada por él.`;
/** Un latigazo tonal por clan (solo los disponibles en solitario tienen entrada). */
export const CHRONICLE_PRELUDE_MASK_STINGER: Partial<Record<ClanId, string>> = {
  brujah:
    "Su máscara se parece demasiado a la rabia legitimada… y eso enamora tribunales tanto como compañías de seguridad.",
  ventrue:
    "Su máscara es soberanía amortiguada — la calma cara que permite negociar aunque dentro quede el sótano todavía húmedo.",
  toreador:
    "Su máscara interpreta tanto el esplendor cuanto la catástrofe; el público de primera fila es él mismo, aplaudiendo hasta romperse.",
  malkavian:
    "Su máscara es el ruido ordenado: nadie oye el patrón igual, y eso lo vuelve sospecha indispensable o error de sistema.",
};
