"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { Mascot } from "./brand";

export function SiteFooter() {
  const { t } = useLang();
  const cols = [
    {
      title: t({ en: "Checkster", ur: "چیکسٹر" }),
      links: [
        { href: "/check", label: t({ en: "Check my home", ur: "اپنا گھر چیک کریں" }) },
        { href: "/check?sample=1", label: t({ en: "Try with a sample", ur: "نمونے سے آزمائیں" }) },
        { href: "/#prices", label: t({ en: "Sarkari rates", ur: "سرکاری ریٹ" }) },
      ],
    },
    {
      title: t({ en: "Kaarigar", ur: "کاریگر" }),
      links: [
        { href: "/worker", label: t({ en: "Join as a kaarigar", ur: "بطور کاریگر شامل ہوں" }) },
        { href: "/worker", label: t({ en: "See job requests", ur: "کام کی درخواستیں دیکھیں" }) },
      ],
    },
    {
      title: t({ en: "Help", ur: "مدد" }),
      links: [
        { href: "/#how", label: t({ en: "How it works", ur: "یہ کیسے کام کرتا ہے" }) },
        { href: "/#promise", label: t({ en: "Our promise", ur: "ہمارا وعدہ" }) },
        // Urdu kept on the English side too, like SadaPay does
        { href: "/#promise", label: "شرائط و ضوابط" },
      ],
    },
  ];

  return (
    <footer className="mt-10">
      <div className="truck-stripe h-3" aria-hidden="true" />
      <div className="bg-sand rounded-t-[2.5rem] -mt-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Mascot size={40} />
              <span className="text-2xl font-black text-ink">{t({ en: "checkster", ur: "چیکسٹر" })}</span>
            </div>
            <p className="mt-4 text-ink-soft leading-relaxed max-w-xs">
              {t({
                en: "A second opinion for every home repair. Pehle samjhein, phir paise dein.",
                ur: "ہر گھریلو مرمت کے لیے دوسری رائے۔ پہلے سمجھیں، پھر پیسے دیں۔",
              })}
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              {t({ en: "Made with care in Peshawar", ur: "پشاور میں محبت سے بنایا گیا" })}
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="text-brand font-extrabold text-lg">{c.title}</h3>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-ink-soft hover:text-ink font-semibold">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 sm:px-6 py-5 text-xs text-ink-soft">
            {t({
              en: "Checkster prototype. Sample data is always labelled. Official rates show their source and date. Not a certified building inspection.",
              ur: "چیکسٹر پروٹوٹائپ۔ نمونہ ڈیٹا ہمیشہ واضح لکھا ہوتا ہے۔ سرکاری ریٹ کے ساتھ ذریعہ اور تاریخ دی گئی ہے۔ یہ سرٹیفائیڈ بلڈنگ انسپیکشن نہیں ہے۔",
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
