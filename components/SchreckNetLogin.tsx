"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { BLOOD_CIPHER, BLOOD_CIPHER_LENGTH, ROOT_OPERATOR_CIPHER } from "@/lib/sessionMeta";

type Props = {
  onAuthenticate: () => void;
  /** Código maestro → narrador + Centro de Mando (solo cliente). */
  onRootAccess?: () => void;
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const BOOT_LINES = ["[CONEXIÓN_ESTABLECIDA]", "[BORRANDO_RASTROS_IP]", "[ACCEDIENDO_AL_CODEX]"] as const;

export function SchreckNetLogin({ onAuthenticate, onRootAccess }: Props) {
  const [cipher, setCipher] = useState("");
  const [error, setError] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);

  const runBoot = useCallback(async (afterBoot: () => void) => {
    setBooting(true);
    setBootLog([]);
    for (const line of BOOT_LINES) {
      await delay(340);
      setBootLog((p) => [...p, line]);
    }
    await delay(380);
    afterBoot();
  }, []);

  function normalizedCipher(raw: string): string {
    return raw.replace(/\D/g, "").slice(0, BLOOD_CIPHER_LENGTH);
  }

  function submit() {
    const digits = normalizedCipher(cipher);
    if (digits === ROOT_OPERATOR_CIPHER && onRootAccess) {
      setError(false);
      void runBoot(onRootAccess);
      return;
    }
    if (digits.length !== BLOOD_CIPHER_LENGTH || digits !== BLOOD_CIPHER) {
      setError(true);
      return;
    }
    setError(false);
    void runBoot(onAuthenticate);
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
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={BLOOD_CIPHER_LENGTH}
              autoComplete="one-time-code"
              value={cipher}
              onChange={(e) => {
                setCipher(normalizedCipher(e.target.value));
                setError(false);
              }}
              placeholder={"·".repeat(BLOOD_CIPHER_LENGTH)}
              aria-label="Código de acceso"
              className={`mt-2 w-full tracking-[0.35em] border bg-black/60 px-2 py-2.5 font-mono text-[11px] text-[var(--terminal)] sharp-border-inner focus:outline-none ${
                error ? "border-[var(--blood)]" : "border-neutral-800 focus:border-[var(--terminal)]/55"
              }`}
            />

            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-widest text-neutral-600/50" aria-hidden>
              1123…
            </p>

            {error ? <p className="mt-3 text-[10px] text-[var(--blood)]">DENEGADO</p> : null}

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
