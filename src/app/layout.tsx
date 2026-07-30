import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/hexclave/server";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vespera — Uncensored AI companions for creators",
  description:
    "Connect OnlyFans, Fansly, Fanvue & Telegram to a persistent character engine with memory, LLM, and human handoff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full font-[family-name:var(--font-body)]">
        <HexclaveProvider app={hexclaveServerApp}>
          <HexclaveTheme>{children}</HexclaveTheme>
        </HexclaveProvider>
      </body>
    </html>
  );
}
