import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Nunito, Noto_Nastaliq_Urdu } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

// Urdu in proper Nastaliq, the way people read it in newspapers and on signboards
const nastaliq = Noto_Nastaliq_Urdu({
  weight: ["400", "700"],
  variable: "--font-nastaliq",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Checkster — Pehle samjhein, phir paise dein",
  description:
    "Photo of a damp wall, a leak or a crack? Checkster explains what's wrong in simple words, checks the price against official rates, and helps you find a nearby kaarigar.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${nunito.variable} ${nastaliq.variable} font-sans antialiased`}>
        <LangProvider>{children}</LangProvider>
        <Analytics />
      </body>
    </html>
  );
}
