"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { LangToggle, Logo } from "./brand";

export function SiteHeader() {
  const { t } = useLang();
  const links = [
    { href: "#how", label: t({ en: "How it works", ur: "یہ کیسے کام کرتا ہے" }) },
    { href: "#prices", label: t({ en: "Sarkari rates", ur: "سرکاری ریٹ" }) },
    { href: "/worker", label: t({ en: "For kaarigars", ur: "کاریگروں کے لیے" }) },
  ];
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 ms-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[15px] font-bold text-ink-soft hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <Link
            href="/check"
            className="whitespace-nowrap rounded-full bg-brand hover:bg-brand-dark text-white font-extrabold px-4 sm:px-5 py-2 text-sm sm:text-[15px] transition-colors"
          >
            <span className="sm:hidden">{t({ en: "Check", ur: "چیک کریں" })}</span>
            <span className="hidden sm:inline">{t({ en: "Start a check", ur: "چیک شروع کریں" })}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
