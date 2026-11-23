"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Languages, MapPin, Search, ShieldCheck, Smartphone } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CITIES, PROBLEMS } from "@/lib/data";
import { setPendingPhoto } from "@/lib/handoff";
import { HeroScene, PROBLEM_ILL } from "@/components/site/illustrations";

export function Hero() {
  const { t } = useLang();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [desc, setDesc] = useState("");
  const [city, setCity] = useState("peshawar");

  const go = (e?: FormEvent) => {
    e?.preventDefault();
    const q = new URLSearchParams({ city });
    if (desc.trim()) q.set("desc", desc.trim());
    router.push(`/check?${q.toString()}`);
  };

  const onPhoto = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setPendingPhoto(URL.createObjectURL(f));
    router.push(`/check?city=${city}&photo=1`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-14 pb-12 grid gap-10 lg:grid-cols-[1.08fr_1fr] items-center">
        <div className="rise-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-3 py-1 text-sm font-bold text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-leaf" />
            {t({ en: "Made for Pakistani homes", ur: "پاکستانی گھروں کے لیے بنایا گیا" })}
          </span>

          <h1 className="mt-5 text-[2.5rem] sm:text-6xl font-black leading-[1.05] tracking-tight text-ink ur-tight">
            {t({ en: "Something wrong at home?", ur: "گھر میں کوئی مسئلہ؟" })}
            <br />
            <span className="relative inline-block isolate">
              <span className="absolute inset-x-0 bottom-1 h-4 sm:h-5 bg-sun -z-10 rounded" aria-hidden="true" />
              {t({ en: "Pehle samjhein,", ur: "پہلے سمجھیں،" })}
            </span>{" "}
            {t({ en: "phir paise dein.", ur: "پھر پیسے دیں۔" })}
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-ink-soft max-w-xl leading-relaxed">
            {t({
              en: "Take a photo of the seelan, leak or darar. We explain what's wrong in simple words, check the price against official rates, and find a trusted kaarigar near you.",
              ur: "سیلن، لیکیج یا دراڑ کی تصویر لیں۔ ہم آسان الفاظ میں بتاتے ہیں کہ مسئلہ کیا ہے، قیمت کو سرکاری ریٹ سے ملاتے ہیں، اور آپ کے قریب قابلِ اعتماد کاریگر ڈھونڈتے ہیں۔",
            })}
          </p>

          {/* The one big thing to do: describe or photograph the problem */}
          <form
            onSubmit={go}
            className="mt-7 bg-white rounded-[1.75rem] border-2 border-ink shadow-[0_6px_0_0_var(--ink)] p-2 flex flex-wrap sm:flex-nowrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 h-12 w-12 rounded-full bg-brand-soft text-brand-dark grid place-items-center hover:bg-brand hover:text-white transition-colors"
              aria-label={t({ en: "Take a photo", ur: "تصویر لیں" })}
              title={t({ en: "Take a photo", ur: "تصویر لیں" })}
            >
              <Camera className="h-6 w-6" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhoto(e.target.files)}
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t({ en: "e.g. bathroom wali deewar mein seelan hai", ur: "مثلاً باتھ روم والی دیوار میں سیلن ہے" })}
              className="flex-1 min-w-0 h-12 bg-transparent px-2 text-base sm:text-lg font-semibold text-ink placeholder:text-ink-soft/70 outline-none"
              aria-label={t({ en: "Describe your problem", ur: "اپنا مسئلہ لکھیں" })}
            />
            <label className="hidden sm:flex items-center gap-1 border-s border-line ps-3 text-ink-soft font-bold">
              <MapPin className="h-4 w-4" />
              <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-transparent outline-none font-bold text-ink py-2">
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.label)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="w-full sm:w-auto h-12 rounded-full bg-brand hover:bg-brand-dark text-white font-extrabold px-6 flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="h-5 w-5" />
              {t({ en: "Check it", ur: "چیک کریں" })}
            </button>
          </form>

          {/* or tap a picture */}
          <div className="mt-6">
            <p className="text-sm font-bold text-ink-soft">{t({ en: "Or tap the one that looks like yours:", ur: "یا جو آپ کے مسئلے جیسا لگے اس پر ٹیپ کریں:" })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROBLEMS.slice(0, 4).map((p) => {
                const Ill = PROBLEM_ILL[p.id];
                return (
                  <Link
                    key={p.id}
                    href={`/check?problem=${p.id}`}
                    className="flex items-center gap-2 rounded-full bg-white border border-line ps-1 pe-4 py-1 font-bold text-ink hover:border-ink transition-colors"
                  >
                    <Ill size={34} />
                    <span className="text-[15px]">{t(p.title)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative rise-in" style={{ animationDelay: "120ms" }}>
          <HeroScene bubble={t({ en: "Fikar na karein!", ur: "فکر نہ کریں!" })} />
        </div>
      </div>

      {/* honest reassurance — no made-up numbers */}
      <div className="border-y border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-bold text-ink">
          {[
            { icon: ShieldCheck, text: t({ en: "Prices checked with official govt. rates", ur: "قیمتیں سرکاری ریٹ سے ملائی جاتی ہیں" }) },
            { icon: Languages, text: t({ en: "Urdu and English", ur: "اردو اور انگریزی" }) },
            { icon: Smartphone, text: t({ en: "Your photos stay on your phone", ur: "آپ کی تصاویر آپ کے فون پر رہتی ہیں" }) },
            { icon: Search, text: t({ en: "No sign-up needed", ur: "سائن اپ کی ضرورت نہیں" }) },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <span className="h-8 w-8 shrink-0 rounded-full bg-sun-soft grid place-items-center">
                <Icon className="h-4 w-4 text-ink" />
              </span>
              <span className="leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
