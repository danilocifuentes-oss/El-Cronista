import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Cronista de las Sombras · Nexo",
  description:
    "Mesa digital inspirada en Vampire V5 (no oficial): SchreckNet, CODEX, dados Sereno y narrador por IA. Entra y juega.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-[var(--void)] text-neutral-200">{children}</body>
    </html>
  );
}
