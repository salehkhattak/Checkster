"use client";

// ============================================================
// English ↔ اردو switch.
// Every piece of text is written as a pair: { en: "...", ur: "..." }
// The English side keeps everyday desi words (seelan, darar, kaarigar)
// so it feels made for Pakistan in both languages.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "ur";
export type Tx = { en: string; ur: string };

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (x: Tx) => string;
  money: (n: number) => string;
  isUrdu: boolean;
}

const LangContext = createContext<LangValue | null>(null);
const KEY = "checkster-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // remember the choice on this device
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved === "en" || saved === "ur") setLangState(saved);
    } catch {
      /* storage blocked – fine, default to English */
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ur" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === "en" ? "ur" : "en")), []);
  const t = useCallback((x: Tx) => x[lang], [lang]);
  const money = useCallback(
    (n: number) => {
      const s = Math.round(n).toLocaleString("en-PK");
      return lang === "ur" ? `${s} روپے` : `Rs ${s}`;
    },
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t, money, isUrdu: lang === "ur" }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangValue {
  const v = useContext(LangContext);
  if (!v) throw new Error("useLang must be used inside <LangProvider>");
  return v;
}

/** Inline helper: <T en="Hello" ur="سلام" /> */
export function T({ en, ur }: Tx) {
  const { lang } = useLang();
  return <>{lang === "ur" ? ur : en}</>;
}
