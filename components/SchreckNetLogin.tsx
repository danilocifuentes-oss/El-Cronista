"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { BLOOD_CIPHER } from "@/lib/sessionMeta";

type Props = {
  onAuthenticate: () => void;
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const BOOT_LINES = ["[CONEXIÓN_ESTABLECIDA]", "[BORRANDO_RASTROS_IP]", "[ACCEDIENDO_AL_CODEX]"] as const;

export function SchreckNetLogin({ onAuthenticate }: Props) {
  const [cipher, setCipher] = useState("");
  const [error, setError] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);

  const runBoot = useCallback(async () => {
    setBooting(true);
    setBootLog([]);
    for (const line of BOOT_LINES) {
      await delay(340);
      setBootLog((p) => [...p, line]);
    }
    await delay(380);
    onAuthenticate();
  }, [onAuthenticate]);

  function submit() {
    if (cipher.trim() !== BLOOD_CIPHER) {
      setError(true);
      return;
    }
    setError(false);
    void runBoot();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6 text-neutral-300 crt-wrap techno-grid font-mono">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="terminal-panel sharp-border-inner w-full max-w-sm px-7 py-8"
      >
        <header className="space-y-1 border-b border-neutral-700/70 pb-4 text-[10px] uppercase leading-relaxed tracking-[0.18em] text-neutral-400">
          <p className="text-[var(--terminal)]/95">CANAL SCHRECK_NET · MNEMÓSYNE</p>
          <p className="text-neutral-600">CODEX V</p>
        </header>

        {!booting ? (
          <>
            <label className="mt-5 block text-[9px] uppercase tracking-widest text-neutral-600">Autorización</label>
            <input
              type="password"
              value={cipher}
              onChange={(e) => {
                setCipher(e.target.value);
                setError(false);
              }}
              placeholder=""
              aria-label="Autorización"
              autoComplete="off"
              className={`mt-2 w-full border bg-black/60 px-2 py-2.5 font-mono text-[11px] text-[var(--terminal)] sharp-border-inner focus:outline-none ${
                error ? "border-[var(--blood)]" : "border-neutral-800 focus:border-[var(--terminal)]/55"
              }`}
            />

            <p className="mt-3 font-mono text-[10px] leading-relaxed opacity-30">1, 1, 2, 3...</p>
            {error ? <p className="mt-1 text-[10px] text-[var(--blood)]">DENEGADO</p> : null}

            <motion.button
              type="button"
              onClick={submit}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.996 }}
              className="relative mt-8 w-full overflow-hidden border border-[var(--terminal)]/35 bg-neutral-950 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.38em] text-[var(--terminal)] sharp-border-inner"
            >
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[var(--terminal)]/15 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10">ACCEDER</span>
            </motion.button>
          </>
        ) : (
          <div className="mt-6 min-h-[6.5rem] font-mono text-[10px] leading-6 text-neutral-500">
            <AnimatePresence>
              {bootLog.map((ln, i) => (
                <motion.p
                  key={`${ln}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={ln.includes("[ACCEDIENDO") ? "text-[var(--terminal)]/80" : undefined}
                >
                  {ln}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
