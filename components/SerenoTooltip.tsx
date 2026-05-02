"use client";

type Props = {
  hint: string;
  children: React.ReactNode;
};

export function SerenoTooltip({ hint, children }: Props) {
  return (
    <span className="group relative inline-flex cursor-help items-center gap-1 align-baseline border-b border-dotted border-neutral-600">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-[min(18rem,80vw)] -translate-x-1/2 rounded border border-neutral-600 bg-[#1a1d22] px-2 py-2 font-sans text-[10px] leading-snug text-neutral-200 shadow-xl group-hover:block group-focus-within:block">
        {hint}
      </span>
    </span>
  );
}
