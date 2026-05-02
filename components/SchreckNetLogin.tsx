"use client";

import { motion } from "framer-motion";

type Props = {
  onAuthenticate: () => void;
};

export function SchreckNetLogin({ onAuthenticate }: Props) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 crt-wrap">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="terminal-panel sharp-border-inner w-full max-w-md p-8"
      >
        <header className="mb-8 font-mono text-[var(--terminal)]">
          <p className="text-xs opacity-70">CANAL SCHRECK_NET // ENCRIPTADO</p>
          <h1 className="mt-2 text-xl font-bold tracking-[0.3em] text-[var(--terminal)] glow-terminal">
            CRONISTA
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-[var(--blood)]">
            de las sombras
          </p>
        </header>

        <label className="block font-mono text-xs uppercase tracking-widest text-neutral-400">
          Cifrado de sangre
        </label>
        <input
          type="password"
          placeholder="████████████████"
          autoComplete="off"
          className="mt-2 w-full border border-neutral-700 bg-black/70 px-3 py-3 font-mono text-sm text-[var(--terminal)] sharp-border-inner focus:border-[var(--terminal)] focus:outline-none"
        />

        <motion.button
          type="button"
          onClick={onAuthenticate}
          className="relative mt-8 w-full overflow-hidden border border-[var(--terminal)]/40 bg-neutral-950 py-4 font-mono text-sm font-semibold uppercase tracking-[0.35em] text-[var(--terminal)] sharp-border-inner"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[var(--terminal)]/25 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative z-10">Autenticación biométrica</span>
        </motion.button>

        <p className="mt-6 font-mono text-[10px] leading-relaxed text-neutral-600">
          &gt; Vínculos vitales falsificados. El Ojo Observa.&lt;
        </p>
      </motion.div>
    </div>
  );
}
