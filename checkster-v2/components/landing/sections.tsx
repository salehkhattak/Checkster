"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, MapPin, Scale, ShieldAlert, Star, Tags } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { OFFICIAL_RATES, PROBLEMS, SOURCES, WORKERS, tradeLabel, type Trade } from "@/lib/data";
import { DemoTag, Mascot } from "@/components/site/brand";
import { IllExperts, IllMapPin, IllPhone, IllPrice, IllWorker, PROBLEM_ILL, TradePicture } from "@/components/site/illustrations";

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-brand font-extrabold tracking-wide text-sm uppercase ur-tight">{kicker}</p>
      <h2 className="mt-2 text-3xl sm:text-[2.6rem] font-black leading-tight text-ink ur-tight">{title}</h2>
      {sub && <p className="mt-3 text-lg text-ink-soft leading-relaxed">{sub}</p>}
    </div>
  );
}

// ---------------- What can we check ----------------
export function ProblemsSection() {
  const { t } = useLang();
  return (
    <section id="problems" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <SectionTitle
        kicker={t({ en: "What can we check?", ur: "ہم کیا چیک کر سکتے ہیں؟" })}
        title={t({ en: "Tap the picture that looks like your problem", ur: "جو تصویر آپ کے مسئلے جیسی ہو اس پر ٹیپ کریں" })}
      />
      <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-10">
        {PROBLEMS.map((p) => {
          const Ill = PROBLEM_ILL[p.id];
          return (
            <Link key={p.id} href={`/check?problem=${p.id}`} className="group text-center flex flex-col items-center">
              <div className="transition-transform group-hover:-translate-y-1">
                <Ill size={132} bg={p.danger ? "var(--danger-soft)" : undefined} />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-ink ur-tight">{t(p.title)}</h3>
              <p className="mt-1 text-sm text-ink-soft max-w-[13rem]">{t(p.line)}</p>
              <span
                className={`mt-3 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                  p.ready ? "bg-leaf-soft text-[#0f6b43]" : p.danger ? "bg-danger-soft text-danger" : "bg-sand text-ink-soft"
                }`}
              >
                {p.ready
                  ? t({ en: "Ready to check", ur: "چیک کے لیے تیار" })
                  : p.danger
                    ? t({ en: "Safety first", ur: "حفاظت پہلے" })
                    : t({ en: "Coming soon", ur: "جلد آ رہا ہے" })}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ---------------- How it works ----------------
export function HowSection() {
  const { t } = useLang();
  const steps = [
    {
      Ill: IllPhone,
      title: t({ en: "Take a photo", ur: "تصویر لیں" }),
      line: t({ en: "Of the seelan, leak or darar. Add a few words if you like.", ur: "سیلن، لیکیج یا دراڑ کی۔ چاہیں تو چند الفاظ بھی لکھیں۔" }),
    },
    {
      Ill: IllExperts,
      title: t({ en: "Experts discuss it", ur: "ماہرین مشورہ کرتے ہیں" }),
      line: t({
        en: "A plumber, a mistri and a waterproofing expert talk it through and ask you 2 questions.",
        ur: "پلمبر، مستری اور واٹر پروفنگ ماہر آپس میں بات کرتے ہیں اور آپ سے دو سوال پوچھتے ہیں۔",
      }),
    },
    {
      Ill: IllPrice,
      title: t({ en: "See the fair price", ur: "مناسب قیمت دیکھیں" }),
      line: t({
        en: "Compared with official government rates. Got a contractor's quote? We check it line by line.",
        ur: "سرکاری ریٹ سے موازنہ۔ ٹھیکیدار کا تخمینہ ہے؟ ہم ہر لائن چیک کرتے ہیں۔",
      }),
    },
    {
      Ill: IllMapPin,
      title: t({ en: "Get a kaarigar", ur: "کاریگر بلائیں" }),
      line: t({
        en: "Offer your price. Nearby kaarigars accept or reply with theirs. You choose.",
        ur: "اپنی قیمت لگائیں۔ قریبی کاریگر قبول کریں یا اپنی قیمت بتائیں۔ فیصلہ آپ کا۔",
      }),
    },
  ];
  return (
    <section id="how" className="bg-white border-y border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <SectionTitle
          kicker={t({ en: "How it works", ur: "یہ کیسے کام کرتا ہے" })}
          title={t({ en: "4 simple steps. No jargon.", ur: "چار آسان قدم۔ کوئی مشکل الفاظ نہیں۔" })}
        />
        <div className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="hidden lg:block absolute top-[68px] inset-x-[12%] border-t-[3px] border-dashed border-line" aria-hidden="true" />
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center flex flex-col items-center">
              <div className="relative">
                <s.Ill size={136} />
                <span className="absolute -top-1 -start-1 h-10 w-10 rounded-full bg-sun border-2 border-ink grid place-items-center text-lg font-black text-ink latin">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-ink ur-tight">{s.title}</h3>
              <p className="mt-2 text-ink-soft leading-relaxed max-w-[16rem]">{s.line}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3 justify-center">
          <Link href="/check" className="rounded-full bg-brand hover:bg-brand-dark text-white font-extrabold px-7 py-3.5 text-lg inline-flex items-center gap-2 transition-colors">
            {t({ en: "Start my check", ur: "میرا چیک شروع کریں" })}
            <ArrowRight className="h-5 w-5 flip-rtl" />
          </Link>
          <Link href="/check?sample=1" className="rounded-full border-2 border-ink text-ink font-extrabold px-7 py-3.5 text-lg hover:bg-sun-soft transition-colors">
            {t({ en: "Try with a sample photo", ur: "نمونے کی تصویر سے آزمائیں" })}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------- Official prices (Thumbtack-style cards) ----------------
export function PricesSection() {
  const { t, money } = useLang();
  const trades = OFFICIAL_RATES.filter((r) => r.source === "pbs");
  const skilled = OFFICIAL_RATES.find((r) => r.id === "skilled")!;
  return (
    <section id="prices" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <SectionTitle
        kicker={t({ en: "Sarkari rates", ur: "سرکاری ریٹ" })}
        title={t({ en: "What a day's work should cost", ur: "ایک دن کے کام کی قیمت کتنی ہونی چاہیے" })}
        sub={t({
          en: "Real numbers published by the government. We use them to check every price, and we always show where each number comes from.",
          ur: "حکومت کے جاری کردہ اصل نمبر۔ ہم ہر قیمت انہی سے ملاتے ہیں، اور ہر نمبر کا ذریعہ ہمیشہ دکھاتے ہیں۔",
        })}
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {trades.map((r) => (
          <div key={r.id} className="rounded-3xl bg-white border border-line overflow-hidden hover:shadow-[0_6px_0_0_var(--line)] transition-shadow">
            <div className="bg-sand h-36 grid place-items-center">
              <TradePicture trade={r.trade as Trade} size={112} bg="#fff" />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-extrabold text-ink">{t(r.label)}</h3>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-ink text-white font-black px-3.5 py-1 text-lg latin">{money(r.amount)}</span>
                <span className="text-sm font-bold text-ink-soft">{t(r.per)}</span>
              </div>
              <p className="mt-3 text-xs text-ink-soft leading-snug">
                {t({ en: "National average · ", ur: "قومی اوسط · " })}
                <a href={SOURCES.pbs.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
                  {t({ en: "PBS, Jan 2026", ur: "ادارہ شماریات، جنوری 2026" })}
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-3xl bg-leaf-soft border border-[#bfe6d2] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="rounded-full bg-leaf text-white font-black px-4 py-1.5 text-xl self-start latin">{money(skilled.amount)}</span>
        <p className="text-ink leading-relaxed">
          <strong>{t(skilled.label)}</strong> {t(skilled.per)} ·{" "}
          {t({ en: "Finance Department Punjab, Jul–Dec 2026. ", ur: "محکمہ خزانہ پنجاب، جولائی تا دسمبر 2026۔ " })}
          <a href={SOURCES.punjab.url} target="_blank" rel="noreferrer" className="underline">
            {t({ en: "Source", ur: "ذریعہ" })}
          </a>
        </p>
      </div>
      <p className="mt-4 text-sm text-ink-soft max-w-3xl">
        {t({
          en: "A real repair also depends on materials, the size of the job and your city. Next: item-level official rates from the KP Market Rate System (MRS).",
          ur: "اصل مرمت کی قیمت سامان، کام کے سائز اور شہر پر بھی منحصر ہے۔ اگلا قدم: کے پی مارکیٹ ریٹ سسٹم (MRS) سے ہر آئٹم کے سرکاری ریٹ۔",
        })}
      </p>
    </section>
  );
}

// ---------------- Offer your price (inDrive-style) ----------------
export function OfferSection() {
  const { t, money } = useLang();
  const offers = WORKERS.slice(0, 3);
  const base = 4500;
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <p className="text-sun font-extrabold tracking-wide text-sm uppercase ur-tight">{t({ en: "Your price, your choice", ur: "آپ کی قیمت، آپ کی مرضی" })}</p>
          <h2 className="mt-2 text-3xl sm:text-[2.6rem] font-black leading-tight ur-tight">
            {t({ en: "Offer your price. Kaarigars reply.", ur: "اپنی قیمت لگائیں۔ کاریگر جواب دیں گے۔" })}
          </h2>
          <p className="mt-4 text-lg text-white/75 leading-relaxed">
            {t({
              en: "No more guessing. You start with a fair price based on official rates. Nearby kaarigars accept it or reply with theirs, and you pick.",
              ur: "اب اندازوں کی ضرورت نہیں۔ آپ سرکاری ریٹ کی بنیاد پر مناسب قیمت سے شروع کرتے ہیں۔ قریبی کاریگر قبول کرتے ہیں یا اپنی قیمت بتاتے ہیں، اور آپ چنتے ہیں۔",
            })}
          </p>
          <ul className="mt-6 space-y-3">
            {[
              { icon: MapPin, text: t({ en: "See how far each kaarigar is, and when they'll arrive", ur: "ہر کاریگر کتنا دور ہے اور کب پہنچے گا، دیکھیں" }) },
              { icon: Star, text: t({ en: "Ratings and number of jobs done", ur: "ریٹنگ اور مکمل کیے گئے کاموں کی تعداد" }) },
              { icon: BadgeCheck, text: t({ en: "CNIC-checked kaarigars (coming next)", ur: "شناختی کارڈ سے تصدیق شدہ کاریگر (اگلے مرحلے میں)" }) },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 rounded-full bg-white/10 grid place-items-center">
                  <Icon className="h-5 w-5 text-sun" />
                </span>
                <span className="font-semibold">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* phone mock with offers */}
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-[2.5rem] bg-[#0d151d] p-3 border border-white/10">
            <div className="rounded-[2rem] bg-cream text-ink p-4">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">{t({ en: "Your offer", ur: "آپ کی پیشکش" })}</p>
                <DemoTag />
              </div>
              <p className="text-3xl font-black mt-1 latin">{money(base)}</p>
              <p className="text-sm text-ink-soft">{t({ en: "Plumber · pressure test + fix leak", ur: "پلمبر · پریشر ٹیسٹ + لیک کی مرمت" })}</p>
              <div className="mt-4 space-y-3">
                {offers.map((w, i) => (
                  <div key={w.id} className="rounded-2xl bg-white border border-line p-3 pop-in" style={{ animationDelay: `${300 + i * 350}ms` }}>
                    <div className="flex items-center gap-3">
                      <span className={`h-11 w-11 rounded-full ${w.tone} text-white font-black grid place-items-center latin`}>{w.initials}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold truncate">{t(w.name)}</p>
                        <p className="text-xs text-ink-soft flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-sun text-sun" /> {w.rating}
                          </span>
                          <span>{t(tradeLabel(w.trade))}</span>
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-black latin">{money(base + w.extra)}</p>
                        <p className="text-xs text-ink-soft flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" /> {w.eta} {t({ en: "min", ur: "منٹ" })} · {w.km} km
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <span className="rounded-xl bg-sand text-center py-2 text-sm font-extrabold text-ink-soft">{t({ en: "Decline", ur: "رد کریں" })}</span>
                      <span className="rounded-xl bg-leaf text-center py-2 text-sm font-extrabold text-white">{t({ en: "Accept", ur: "قبول کریں" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- Our promise ----------------
export function PromiseSection() {
  const { t } = useLang();
  const items = [
    {
      icon: Scale,
      title: t({ en: "We never call anyone a cheat", ur: "ہم کسی کو دھوکے باز نہیں کہتے" }),
      line: t({
        en: "We show what's missing or unclear, and give you polite questions to ask.",
        ur: "ہم بتاتے ہیں کیا کمی ہے یا کیا واضح نہیں، اور آپ کو پوچھنے کے لیے شائستہ سوال دیتے ہیں۔",
      }),
    },
    {
      icon: Tags,
      title: t({ en: "Every price shows its source", ur: "ہر قیمت کا ذریعہ لکھا ہوتا ہے" }),
      line: t({
        en: "Official rates say who published them and when. Demo numbers are clearly labelled.",
        ur: "سرکاری ریٹ کے ساتھ لکھا ہوتا ہے کس نے اور کب جاری کیا۔ ڈیمو نمبر واضح طور پر الگ لکھے ہوتے ہیں۔",
      }),
    },
    {
      icon: ShieldAlert,
      title: t({ en: "Danger? Call a pro", ur: "خطرہ؟ ماہر کو بلائیں" }),
      line: t({
        en: "Water near wiring, deep cracks or a gas smell: we tell you to call a qualified professional.",
        ur: "وائرنگ کے پاس پانی، گہری دراڑیں یا گیس کی بو: ہم آپ کو مستند ماہر بلانے کا کہتے ہیں۔",
      }),
    },
  ];
  return (
    <section id="promise" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="rounded-[2.5rem] bg-sun-soft border-2 border-ink p-6 sm:p-10">
        <div className="flex items-center gap-4">
          <Mascot size={64} mood="wink" />
          <div>
            <p className="text-brand font-extrabold tracking-wide text-sm uppercase ur-tight">{t({ en: "Our promise", ur: "ہمارا وعدہ" })}</p>
            <h2 className="text-2xl sm:text-4xl font-black text-ink leading-tight ur-tight">
              {t({ en: "Honest, because it's your home.", ur: "ایمانداری، کیونکہ یہ آپ کا گھر ہے۔" })}
            </h2>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map(({ icon: Icon, title, line }) => (
            <div key={title} className="rounded-3xl bg-white border border-line p-6">
              <Icon className="h-7 w-7 text-brand" />
              <h3 className="mt-3 text-lg font-extrabold text-ink ur-tight">{title}</h3>
              <p className="mt-2 text-ink-soft leading-relaxed">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- For kaarigars ----------------
export function WorkerBand() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
      <div className="rounded-[2.5rem] bg-sky text-white p-6 sm:p-10 grid gap-8 md:grid-cols-[auto_1fr_auto] items-center">
        <IllWorker size={150} bg="rgba(255,255,255,0.18)" />
        <div>
          <h2 className="text-2xl sm:text-4xl font-black leading-tight ur-tight">
            {t({ en: "Kaarigar hain? Kaam payein, izzat ke saath.", ur: "کاریگر ہیں؟ کام پائیں، عزت کے ساتھ۔" })}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3 text-white/90 font-semibold">
            <li>• {t({ en: "Jobs near you, with photos", ur: "قریب کے کام، تصاویر کے ساتھ" })}</li>
            <li>• {t({ en: "You set your own price", ur: "قیمت آپ خود طے کریں" })}</li>
            <li>• {t({ en: "Simple app in Urdu", ur: "اردو میں آسان ایپ" })}</li>
          </ul>
        </div>
        <Link href="/worker" className="rounded-full bg-white text-sky-dark font-extrabold px-6 py-3.5 text-lg inline-flex items-center gap-2 hover:bg-sun hover:text-ink transition-colors justify-center">
          {t({ en: "Join as a kaarigar", ur: "بطور کاریگر شامل ہوں" })}
          <ArrowRight className="h-5 w-5 flip-rtl" />
        </Link>
      </div>
    </section>
  );
}
