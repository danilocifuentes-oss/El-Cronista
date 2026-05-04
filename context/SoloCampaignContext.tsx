"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SoloProgress } from "@/lib/soloCampaign/types";

type SoloCampaignCtx = {
  progress: SoloProgress;
  setProgress: (next: SoloProgress) => void;
};

const SoloCampaignContext = createContext<SoloCampaignCtx | null>(null);

export function SoloCampaignProvider({
  initialProgress,
  children,
}: {
  initialProgress: SoloProgress;
  children: ReactNode;
}) {
  const [progress, setProgressState] = useState<SoloProgress>(initialProgress);
  const value = useMemo(
    () => ({
      progress,
      setProgress: setProgressState,
    }),
    [progress],
  );
  return <SoloCampaignContext.Provider value={value}>{children}</SoloCampaignContext.Provider>;
}

export function useSoloCampaign() {
  const ctx = useContext(SoloCampaignContext);
  if (!ctx) throw new Error("useSoloCampaign fuera de SoloCampaignProvider");
  return ctx;
}
