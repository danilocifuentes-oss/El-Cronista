import type { ClanId } from "@/lib/character";

export type FrictionProfile = {
  clanId: ClanId | null;
  /** Marcas de daño a salud (V5). */
  healthDamage: number;
  humanidad: number | null;
  hambre: number;
  /** Amenaza inquisitorial 0–5 (σ mesa). */
  sigma: number;
  seed: number;
};

/** Degrada superficie textual (ruido SchreckNet, paridad rota) según cuerpo/mente y σ. Solo ASCII seguro. */
export function applyFriction(text: string, p: FrictionProfile): string {
  let strength =
    p.sigma * 0.11 +
    Math.min(5, p.healthDamage) * 0.09 +
    (p.humanidad != null && p.humanidad <= 3 ? 0.22 : 0) +
    (p.hambre >= 4 ? 0.18 : 0);
  if (p.clanId === "malkavian") strength += 0.06;
  strength = Math.min(0.85, strength);

  const chars = [...text];
  const out: string[] = [];
  let h = p.seed >>> 0;
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]!;
    h = (Math.imul(31, h) + ch.charCodeAt(0) + i) | 0;
    const r = (Math.abs(h) % 1000) / 1000;
    if (r < strength * 0.028 && /[aeiou]/i.test(ch)) {
      out.push(ch);
      if (r < strength * 0.012) out.push("'");
    } else if (r < strength * 0.018 && /o/i.test(ch)) {
      out.push("0");
    } else if (r < strength * 0.015 && ch === " ") {
      out.push("  ");
    } else if (r < strength * 0.01) {
      out.push("_");
    } else {
      out.push(ch);
    }
  }
  return out.join("");
}

/** Hambre > 3: prosa corta, cortes secos. */
export function compressBeastProse(text: string, hambre: number, seed: number): string {
  if (hambre <= 3) return text;
  const parts = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const take = hambre >= 5 ? 2 : 3;
  let body = parts.slice(0, take).join("\n\n");
  const maxChars = hambre >= 5 ? 420 : 620;
  if (body.length > maxChars) {
    const sliceAt = maxChars - 1;
    const cut = body.lastIndexOf(".", sliceAt);
    body = (cut > sliceAt * 0.5 ? body.slice(0, cut + 1) : `${body.slice(0, sliceAt)}…`).trim();
  }
  const stingers = [
    "La Bestia ordena silencio útil.",
    "Cada sílaba cuesta: apretá antes de que el hambre elija por vos.",
    "No hay margen para poesía barata — solo filo y calle.",
  ];
  if (hambre >= 5 && Math.abs(seed) % 2 === 0) {
    body += `\n\n${stingers[Math.abs(seed) % stingers.length]}`;
  }
  return body;
}
