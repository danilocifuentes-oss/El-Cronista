import type { ClanId } from "@/lib/character";

/** Voz inicial común antes de la intro de clan; se muestra una sola vez por personaje/clan guardado. */
export const CHRONICLE_PRELUDE_COMMON = `No es cuento bien educado: es una segunda oportunidad que duele cuando la Bestia aclara cada detalle olvidado por los vivos.

Juegas esta crónica en solitario, pero dentro del relato nadie navega despoblado: la ciudad te mira con algoritmos y porterías; lo oculto exige pactos antes que confesiones.

Las tiradas ordenan probabilidad sobre deseo — no son adorno frente al texto; son donde la noche muestra si tu personaje sobrevivió a ti mismo un instante más.

Aquí también importa la Máscara: la cara mortal y la cortesía vampírica con las que amortiguas terror, arrogancia u obsesión antes de que se vuelvan pública hambre.`;

/** Un latigazo tonal por clan (solo los disponibles en solitario tienen entrada). */
export const CHRONICLE_PRELUDE_MASK_STINGER: Partial<Record<ClanId, string>> = {
  brujah:
    "Tu máscara se parece demasiado a la rabia legitimada… y eso enamora tribunales tanto como compañías de seguridad.",
  ventrue:
    "Tu máscara es soberanía amortiguada — la calma cara que permite negociar aunque dentro quede el sótano todavía húmedo.",
  toreador:
    "Tu máscara interpreta tanto el esplendor cuanto la catástrofe; el público de primera fila eres tú, aplaudiendo hasta romperse.",
};
