"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { loadMeta, loadNarratorFlag, saveNarratorFlag } from "@/lib/sessionMeta";

export type ForcedRollKind = "frenesy" | "enardecimiento";

export type ForcedState = null | {
  kind: ForcedRollKind;
  difficulty: number;
};

type Ctx = {
  isNarrator: boolean;
  setIsNarrator: (v: boolean) => void;
  famineIntervalMinutes: number;
  setFamineIntervalMinutes: (m: number) => void;
  rollDifficulty: number;
  setRollDifficulty: (d: number) => void;
  forcedRoll: ForcedState;
  requestForcedRoll: (kind: ForcedRollKind, difficulty?: number) => void;
  clearForcedRoll: () => void;
};

const GameSessionContext = createContext<Ctx | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [isNarrator, setIsNarratorState] = useState(() =>
    typeof window === "undefined" ? false : loadNarratorFlag(),
  );
  const [famineIntervalMinutes, setFamineIntervalMinutes] = useState(() => {
    if (typeof window === "undefined") return 60;
    const meta = loadMeta();
    return meta.famineIntervalMinutes ?? 60;
  });
  const [rollDifficulty, setRollDifficulty] = useState(3);
  const [forcedRoll, setForcedRoll] = useState<ForcedState>(null);

  const setIsNarrator = useCallback((v: boolean) => {
    setIsNarratorState(v);
    saveNarratorFlag(v);
  }, []);

  const requestForcedRoll = useCallback((kind: ForcedRollKind, difficulty = 3) => {
    setForcedRoll({ kind, difficulty });
  }, []);

  const clearForcedRoll = useCallback(() => setForcedRoll(null), []);

  const value = useMemo(
    () => ({
      isNarrator,
      setIsNarrator,
      famineIntervalMinutes,
      setFamineIntervalMinutes,
      rollDifficulty,
      setRollDifficulty,
      forcedRoll,
      requestForcedRoll,
      clearForcedRoll,
    }),
    [
      isNarrator,
      setIsNarrator,
      famineIntervalMinutes,
      rollDifficulty,
      setRollDifficulty,
      forcedRoll,
      requestForcedRoll,
      clearForcedRoll,
    ],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession(): Ctx {
  const ctx = useContext(GameSessionContext);
  if (!ctx) throw new Error("useGameSession fuera de GameSessionProvider");
  return ctx;
}
