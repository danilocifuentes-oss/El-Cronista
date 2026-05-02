import { SERENO_DISCLAIMER } from "@/lib/sereno";

export function SerenoFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950/80 px-4 py-4 text-center font-mono text-[9px] leading-relaxed text-neutral-600 sharp-border-inner">
      {SERENO_DISCLAIMER}
    </footer>
  );
}
