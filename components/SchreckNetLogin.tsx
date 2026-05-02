"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BLOOD_CIPHER } from "@/lib/sessionMeta";

type Props = {
  onAuthenticate: () => void;
};

export function SchreckNetLogin({ onAuthenticate }: Props) {
  const [cipher, setCipher] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (cipher.trim() !== BLOOD_CIPHER) {
      setError(true);
      return;
    }
    setError(false);
    onAuthenticate();
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 crt-wrap techno-grid">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="terminal-panel sharp-border-inner w-full max-w-md p-8"
      >
        <header className="mb-8 font-mono text-[var(--terminal)]">
          <p className="text-xs opacity-70">CANAL SCHRECK_NET // ENCRIPTADO · MNEMÓSYNE</p>
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
          value={cipher}
          onChange={(e) => {
            setCipher(e.target.value);
            setError(false);
          }}
          placeholder="████████████████"
          autoComplete="off"
          className={`mt-2 w-full border bg-black/70 px-3 py-3 font-mono text-sm text-[var(--terminal)] sharp-border-inner focus:outline-none ${
            error ? "border-[var(--blood)]" : "border-neutral-700 focus:border-[var(--terminal)]"
          }`}
        />

        <p className="fibonacci-whisper mt-4 font-mono text-[11px] leading-relaxed">
          La Bestia no suma, la Bestia se expande… Mira cómo la sangre se devora a sí misma en una espiral infinita.
        </p>

        {error && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-[var(--blood)]">
            Nodo rechazado. El enigma sigue vivo.
          </p>
        )}

        <motion.button
          type="button"
          onClick={submit}
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
          &gt; Vínculos vitales falsificados. El Ojo Observa. Reloj Mnemósine en espera.&lt;
        </p>
      </motion.div>
    </div>
  );
}
