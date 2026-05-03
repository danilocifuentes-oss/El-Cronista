"use client";

import { NexusLibrary } from "@/components/icons/NexusLibrary";
import type { NexoGlyphKind } from "@/lib/icons/glyphSignals";
import { splitNexoGlyphInline } from "@/lib/icons/nexoGlyphTokens";

type Props = {
  text: string;
  /** σ 0–5 — glifo inquisición inline. */
  sigma?: number;
  /** Hambre — pulso en glifo sangre si aplica. */
  hunger?: number;
};

function InlineGlyph({
  kind,
  sigma,
  bloodPulse,
}: {
  kind: NexoGlyphKind;
  sigma: number;
  bloodPulse: boolean;
}) {
  const box = "inline-block h-4 w-4 shrink-0 align-middle mx-0.5";
  switch (kind) {
    case "inquisition":
      return <NexusLibrary.Inquisicion sigma={sigma} className={box} />;
    case "blood":
      return <NexusLibrary.Sangre className={box} pulse={bloodPulse} />;
    case "destiny":
      return <NexusLibrary.Destino className={`${box} text-[color:var(--terminal)]`} />;
    case "terminal":
      return <NexusLibrary.Cronista className={box} />;
    case "circuit":
      return <NexusLibrary.Circuit className={box} />;
    case "vastago":
      return <NexusLibrary.Vastago className={box} />;
    default:
      return null;
  }
}

/**
 * Párrafo seguro: solo texto + iconos React; reconoce `[[GLYPH:kind]]` con lista blanca.
 */
export function NexoProseWithGlyphs({ text, sigma = 0, hunger = 0 }: Props) {
  const bloodPulse = hunger > 2;
  const parts = splitNexoGlyphInline(text);
  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <span key={i}>{p.value}</span>
        ) : (
          <InlineGlyph key={i} kind={p.kind} sigma={sigma} bloodPulse={bloodPulse} />
        ),
      )}
    </>
  );
}
