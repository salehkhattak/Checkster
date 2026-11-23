"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, CheckCircle2, Clock, MapPin, Minus, Navigation, Phone, Plus, Power, Ruler, X } from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { AREAS, JOB_REQUESTS, TRADES, officialDayRange, tradeLabel, type JobRequest, type Trade } from "@/lib/data";
import { DemoTag, LangToggle, Logo, Mascot, OfficialTag } from "@/components/site/brand";
import { PROBLEM_ILL, TradePicture } from "@/components/site/illustrations";
import { BackButton, Card, CardTitle, Chip, Hint, PrimaryButton } from "@/components/check/shell";

const GUIDE: Tx[] = [
  { en: "Salaam, ustad! What work do you do? Tap one or more.", ur: "السلام علیکم استاد! آپ کیا کام کرتے ہیں؟ ایک یا زیادہ پر ٹیپ کریں۔" },
  { en: "Your name, phone number and the areas where you work.", ur: "آپ کا نام، فون نمبر اور وہ علاقے جہاں آپ کام کرتے ہیں۔" },
  { en: "Set your daily rate and add photos of your past work.", ur: "اپنا یومیہ ریٹ لگائیں اور پرانے کام کی تصاویر لگائیں۔" },
  { en: "Go online to get jobs near you. Accept, or offer your own price.", ur: "قریب کے کام پانے کے لیے آن لائن ہوں۔ قبول کریں، یا اپنی قیمت بتائیں۔" },
];

interface Profile {
  trades: Trade[];
  name: string;
  phone: string;
  areas: string[];
  years: number;
  rate: number;
  photos: string[];
}

export function WorkerApp() {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({ trades: [], name: "", phone: "", areas: ["hayatabad"], years: 5, rate: 2000, photos: [] });
  const [nudge, setNudge] = useState(false);
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNudge(false);
  }, [step]);

  let actions: ReactNode = null;
  if (step === 0) {
    actions = p.trades.length ? (
      <PrimaryButton tone="sky" onClick={() => setStep(1)}>
        {t({ en: "Next", ur: "اگلا" })} <ArrowRight className="h-5 w-5 flip-rtl" />
      </PrimaryButton>
    ) : (
      <Hint>{t({ en: "Tap at least one kind of work", ur: "کم از کم ایک کام پر ٹیپ کریں" })}</Hint>
    );
  } else if (step === 1) {
    const ok = p.name.trim().length > 1 && p.phone.replace(/\D/g, "").length >= 10;
    actions = (
      <>
        <BackButton onClick={() => setStep(0)} />
        {ok ? (
          <PrimaryButton tone="sky" onClick={() => setStep(2)}>
            {t({ en: "Next", ur: "اگلا" })} <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        ) : (
          <PrimaryButton tone="sky" onClick={() => setNudge(true)}>
            {t({ en: "Next", ur: "اگلا" })} <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        )}
      </>
    );
  } else if (step === 2) {
    actions = (
      <>
        <BackButton onClick={() => setStep(1)} />
        <PrimaryButton tone="sky" onClick={() => setStep(3)}>
          {t({ en: "Start getting jobs", ur: "کام لینا شروع کریں" })} <ArrowRight className="h-5 w-5 flip-rtl" />
        </PrimaryButton>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f8fd]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#d6e8f6]">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <Logo href="/worker" worker />
          <div className="ms-auto flex items-center gap-2">
            <LangToggle />
            <Link href="/" className="hidden sm:inline text-sm font-bold text-ink-soft hover:text-ink px-2">
              {t({ en: "For homeowners", ur: "گھر والوں کے لیے" })}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pt-5 pb-36">
        {step < 3 && (
          <div className="flex items-center gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-2.5 rounded-full transition-all ${i === step ? "w-10 bg-sky" : i < step ? "w-5 bg-leaf" : "w-5 bg-[#d6e8f6]"}`} />
            ))}
          </div>
        )}
        <div className="mt-5 flex items-end gap-3" aria-live="polite">
          <Mascot size={52} className="shrink-0" />
          <div className="rounded-2xl rounded-bl-md rtl:rounded-bl-2xl rtl:rounded-br-md bg-white border-2 border-ink px-4 py-3 font-bold text-ink leading-snug">
            {t(GUIDE[step])}
          </div>
        </div>

        <div className="mt-6">
          {step === 0 && <TradesStep p={p} set={set} />}
          {step === 1 && <DetailsStep p={p} set={set} nudge={nudge} />}
          {step === 2 && <RateStep p={p} set={set} />}
          {step === 3 && <Dashboard p={p} />}
        </div>
      </main>

      {actions && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-line">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">{actions}</div>
        </div>
      )}
    </div>
  );
}

// ---------------- signup step 1: trades ----------------
function TradesStep({ p, set }: { p: Profile; set: (x: Partial<Profile>) => void }) {
  const { t } = useLang();
  const toggle = (id: Trade) => set({ trades: p.trades.includes(id) ? p.trades.filter((x) => x !== id) : [...p.trades, id] });
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {TRADES.map((tr) => {
        const on = p.trades.includes(tr.id);
        return (
          <button
            key={tr.id}
            type="button"
            onClick={() => toggle(tr.id)}
            aria-pressed={on}
            className={`relative rounded-3xl border-2 p-4 flex flex-col items-center text-center transition-colors ${
              on ? "border-ink bg-sky-soft shadow-[0_4px_0_0_var(--ink)]" : "border-[#d6e8f6] bg-white hover:border-ink"
            }`}
          >
            {on && (
              <span className="absolute top-3 end-3 h-7 w-7 rounded-full bg-sky text-white grid place-items-center">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            )}
            <TradePicture trade={tr.id} size={92} bg={on ? "#fff" : "var(--sky-soft)"} />
            <span className="mt-2 text-lg font-black text-ink ur-tight">{t(tr.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- signup step 2: details ----------------
function DetailsStep({ p, set, nudge }: { p: Profile; set: (x: Partial<Profile>) => void; nudge: boolean }) {
  const { t } = useLang();
  const nameBad = nudge && p.name.trim().length < 2;
  const phoneBad = nudge && p.phone.replace(/\D/g, "").length < 10;
  return (
    <div className="space-y-5">
      <Card>
        <label className="block font-black text-ink text-lg" htmlFor="w-name">
          {t({ en: "Your name", ur: "آپ کا نام" })}
        </label>
        <input
          id="w-name"
          value={p.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={t({ en: "e.g. Rahim Khan", ur: "مثلاً رحیم خان" })}
          className={`mt-2 w-full h-14 rounded-2xl border-2 ${nameBad ? "border-danger" : "border-line"} focus:border-ink outline-none px-4 text-lg font-bold`}
        />
        {nameBad && <p className="mt-1 text-sm font-bold text-danger">{t({ en: "Please write your name", ur: "براہ کرم اپنا نام لکھیں" })}</p>}

        <label className="block font-black text-ink text-lg mt-5" htmlFor="w-phone">
          {t({ en: "Mobile number", ur: "موبائل نمبر" })}
        </label>
        <div className={`mt-2 flex items-center h-14 rounded-2xl border-2 ${phoneBad ? "border-danger" : "border-line"} focus-within:border-ink overflow-hidden`} dir="ltr">
          <span className="px-4 h-full grid place-items-center bg-sand font-black text-ink latin">+92</span>
          <input
            id="w-phone"
            inputMode="tel"
            value={p.phone}
            onChange={(e) => set({ phone: e.target.value.replace(/[^0-9 ]/g, "") })}
            placeholder="3xx xxxxxxx"
            className="flex-1 h-full outline-none px-3 text-lg font-bold latin"
          />
        </div>
        {phoneBad && <p className="mt-1 text-sm font-bold text-danger">{t({ en: "Please write a 10-digit number", ur: "براہ کرم 10 ہندسوں کا نمبر لکھیں" })}</p>}
        <p className="mt-2 text-sm text-ink-soft font-semibold">
          {t({ en: "Customers only see your number after you accept their job.", ur: "گاہک آپ کا نمبر صرف تب دیکھتے ہیں جب آپ ان کا کام قبول کریں۔" })}
        </p>
      </Card>

      <Card>
        <CardTitle>{t({ en: "Where do you work?", ur: "آپ کہاں کام کرتے ہیں؟" })}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip
              key={a.id}
              active={p.areas.includes(a.id)}
              onClick={() => set({ areas: p.areas.includes(a.id) ? p.areas.filter((x) => x !== a.id) : [...p.areas, a.id] })}
            >
              {t(a.label)}
            </Chip>
          ))}
        </div>
        <p className="font-black text-ink text-lg mt-6">{t({ en: "Years of experience", ur: "تجربہ (سال)" })}</p>
        <Stepper value={p.years} onChange={(n) => set({ years: Math.max(0, Math.min(50, n)) })} step={1} display={`${p.years}`} />
      </Card>
    </div>
  );
}

// ---------------- signup step 3: rate + photos ----------------
function RateStep({ p, set }: { p: Profile; set: (x: Partial<Profile>) => void }) {
  const { t, money } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const main = p.trades[0] ?? "mason";
  const [lo, hi] = officialDayRange(main);
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files)
      .slice(0, 4 - p.photos.length)
      .map((f) => URL.createObjectURL(f));
    set({ photos: [...p.photos, ...urls] });
  };
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle sub={t({ en: "You can always change it. Customers can also offer their own price.", ur: "آپ اسے کبھی بھی بدل سکتے ہیں۔ گاہک بھی اپنی قیمت لگا سکتے ہیں۔" })}>
          {t({ en: "Your daily rate", ur: "آپ کا یومیہ ریٹ" })}
        </CardTitle>
        <Stepper value={p.rate} onChange={(n) => set({ rate: Math.max(500, n) })} step={100} display={money(p.rate)} />
        <div className="mt-4 rounded-2xl bg-leaf-soft p-4 flex flex-wrap items-center gap-2">
          <OfficialTag />
          <p className="font-bold text-ink">
            {t(tradeLabel(main))}: <span className="latin">{money(lo)} – {money(hi)}</span> {t({ en: "per day", ur: "فی دن" })}
          </p>
          <p className="w-full text-xs text-ink-soft">
            {t({ en: "PBS national average (Jan 2026) and Punjab govt. skilled rate (Jul–Dec 2026)", ur: "ادارہ شماریات قومی اوسط (جنوری 2026) اور پنجاب حکومت ہنر مند ریٹ (جولائی تا دسمبر 2026)" })}
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle sub={t({ en: "Customers trust kaarigars who show their work. Up to 4 photos.", ur: "گاہک ان کاریگروں پر بھروسا کرتے ہیں جو اپنا کام دکھاتے ہیں۔ زیادہ سے زیادہ 4 تصاویر۔" })}>
          {t({ en: "Photos of your past work", ur: "آپ کے پرانے کام کی تصاویر" })}
        </CardTitle>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
        <div className="grid grid-cols-4 gap-2">
          {p.photos.map((src) => (
            <div key={src} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(src);
                  set({ photos: p.photos.filter((x) => x !== src) });
                }}
                className="absolute top-1 end-1 h-7 w-7 rounded-full bg-white/90 grid place-items-center"
                aria-label={t({ en: "Remove photo", ur: "تصویر ہٹائیں" })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {p.photos.length < 4 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-2xl border-[3px] border-dashed border-sky bg-sky-soft/60 text-sky-dark grid place-items-center hover:bg-sky-soft"
              aria-label={t({ en: "Add photos", ur: "تصاویر لگائیں" })}
            >
              <Camera className="h-8 w-8" />
            </button>
          )}
        </div>
      </Card>

      <div className="rounded-3xl bg-white border-2 border-dashed border-[#d6e8f6] p-5 flex gap-3 items-start">
        <BadgeCheck className="h-6 w-6 text-sky shrink-0" />
        <p className="font-semibold text-ink-soft">
          {t({
            en: "Next version: we verify your CNIC with a short phone call, and you get a blue tick. Not part of this demo.",
            ur: "اگلے ورژن میں: ہم ایک مختصر فون کال سے آپ کے شناختی کارڈ کی تصدیق کریں گے، اور آپ کو نیلا نشان ملے گا۔ یہ اس ڈیمو کا حصہ نہیں۔",
          })}
        </p>
      </div>
    </div>
  );
}

function Stepper({ value, onChange, step, display }: { value: number; onChange: (n: number) => void; step: number; display: string }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-4">
      <button type="button" onClick={() => onChange(value - step)} className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sky-soft" aria-label={`-${step}`}>
        <Minus className="h-6 w-6" />
      </button>
      <span className="text-4xl font-black text-ink min-w-[8rem] text-center latin whitespace-nowrap">{display}</span>
      <button type="button" onClick={() => onChange(value + step)} className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sky-soft" aria-label={`+${step}`}>
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

// ---------------- dashboard: incoming jobs ----------------
type JobState = { status: "new" | "counter" | "sent" | "confirmed" | "skipped"; price: number };

function Dashboard({ p }: { p: Profile }) {
  const { t, money } = useLang();
  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<Record<string, JobState>>(() => Object.fromEntries(JOB_REQUESTS.map((j) => [j.id, { status: "new", price: j.offer }])));
  const update = (id: string, s: Partial<JobState>) => setJobs((x) => ({ ...x, [id]: { ...x[id], ...s } }));

  const send = (id: string, price: number) => {
    update(id, { status: "sent", price });
    setTimeout(() => update(id, { status: "confirmed" }), 1800);
  };

  const confirmed = JOB_REQUESTS.filter((j) => jobs[j.id].status === "confirmed");
  const earnings = confirmed.reduce((s, j) => s + jobs[j.id].price, 0);
  const initials = (p.name.trim() || "Kaarigar")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-5">
      <Card className="border-[#d6e8f6]">
        <div className="flex items-center gap-4">
          <span className="h-16 w-16 rounded-full bg-sky text-white text-2xl font-black grid place-items-center border-2 border-ink latin">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-black text-ink truncate">{p.name.trim() || t({ en: "Kaarigar", ur: "کاریگر" })}</p>
            <p className="text-ink-soft font-bold">
              {(p.trades.length ? p.trades : (["plumber"] as Trade[])).map((tr) => t(tradeLabel(tr))).join(" · ")}
            </p>
            <p className="text-sm text-ink-soft font-semibold">
              <span className="latin">{money(p.rate)}</span> {t({ en: "per day", ur: "فی دن" })} · {p.years} {t({ en: "yrs experience", ur: "سال تجربہ" })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnline((o) => !o)}
          aria-pressed={online}
          className={`mt-5 w-full h-16 rounded-2xl border-2 border-ink flex items-center gap-3 px-4 font-black text-lg transition-colors ${
            online ? "bg-leaf text-white" : "bg-white text-ink hover:bg-sky-soft"
          }`}
        >
          <Power className="h-6 w-6" />
          <span className="flex-1 text-start">
            {online ? t({ en: "You're online. Jobs are coming in.", ur: "آپ آن لائن ہیں۔ کام آ رہے ہیں۔" }) : t({ en: "You're offline. Tap to go online.", ur: "آپ آف لائن ہیں۔ آن لائن ہونے کے لیے ٹیپ کریں۔" })}
          </span>
          <span className={`h-8 w-14 rounded-full p-1 transition-colors ${online ? "bg-white/30" : "bg-sand"}`}>
            <span className={`block h-6 w-6 rounded-full bg-white border-2 border-ink transition-transform ${online ? "translate-x-6 rtl:-translate-x-6" : ""}`} />
          </span>
        </button>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sky-soft p-3">
            <p className="text-xs font-extrabold text-sky-dark">{t({ en: "Jobs confirmed", ur: "کنفرم کام" })}</p>
            <p className="text-2xl font-black text-ink latin">{confirmed.length}</p>
          </div>
          <div className="rounded-2xl bg-leaf-soft p-3">
            <p className="text-xs font-extrabold text-[#0f6b43]">{t({ en: "Earnings (demo)", ur: "کمائی (ڈیمو)" })}</p>
            <p className="text-2xl font-black text-ink latin">{money(earnings)}</p>
          </div>
        </div>
      </Card>

      {online ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-ink">{t({ en: "Jobs near you", ur: "آپ کے قریب کام" })}</h2>
            <DemoTag />
          </div>
          {JOB_REQUESTS.filter((j) => jobs[j.id].status !== "skipped").map((j, i) => (
            <JobCard
              key={j.id}
              job={j}
              state={jobs[j.id]}
              delay={i * 450}
              onAccept={() => send(j.id, j.offer)}
              onCounter={() => update(j.id, { status: "counter", price: j.offer + 500 })}
              onPrice={(n) => update(j.id, { price: n })}
              onSendCounter={() => send(j.id, jobs[j.id].price)}
              onSkip={() => update(j.id, { status: "skipped" })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-[#c5ddef] p-8 text-center">
          <Mascot size={64} mood="think" className="mx-auto" />
          <p className="mt-3 font-bold text-ink-soft">{t({ en: "Go online to see job requests near you.", ur: "اپنے قریب کام کی درخواستیں دیکھنے کے لیے آن لائن ہوں۔" })}</p>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  state,
  delay,
  onAccept,
  onCounter,
  onPrice,
  onSendCounter,
  onSkip,
}: {
  job: JobRequest;
  state: JobState;
  delay: number;
  onAccept: () => void;
  onCounter: () => void;
  onPrice: (n: number) => void;
  onSendCounter: () => void;
  onSkip: () => void;
}) {
  const { t, money } = useLang();
  const Ill = PROBLEM_ILL[job.problem];

  if (state.status === "confirmed") {
    return (
      <div className="rounded-3xl bg-leaf text-white p-5 pop-in">
        <p className="text-xl font-black flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6" /> {t({ en: "Job confirmed!", ur: "کام کنفرم ہو گیا!" })}
        </p>
        <p className="mt-1 font-bold text-white/90">
          {t(job.title)} · {t(job.area)} · <span className="latin">{money(state.price)}</span>
        </p>
        <p className="text-white/85 font-semibold">{t(job.when)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <span className="h-12 rounded-2xl bg-white text-[#0f6b43] font-extrabold inline-flex items-center justify-center gap-2">
            <Navigation className="h-4 w-4" /> {t({ en: "Directions", ur: "راستہ" })}
          </span>
          <span className="h-12 rounded-2xl bg-white/15 font-extrabold inline-flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" /> {t({ en: "Call customer", ur: "گاہک کو کال" })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border-2 border-[#d6e8f6] p-4 sm:p-5 pop-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-3 items-start">
        <Ill size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-ink leading-tight ur-tight">{t(job.title)}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {t(job.area)} · <span className="latin">{job.km} km</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {t(job.when)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {t(job.size)}
            </span>
          </div>
        </div>
        <div className="text-end shrink-0">
          <p className="text-xs font-extrabold text-ink-soft">{t({ en: "Offer", ur: "پیشکش" })}</p>
          <p className="text-2xl font-black text-ink latin">{money(job.offer)}</p>
        </div>
      </div>

      {/* the worker sees the diagnosis before going: fewer wasted trips */}
      <div className="mt-3 rounded-2xl bg-sun-soft p-3 flex gap-2 items-start">
        <Mascot size={28} className="shrink-0" />
        <p className="text-sm font-bold text-ink">
          <span className="text-ink-soft">{t({ en: "Checkster says: ", ur: "چیکسٹر کہتا ہے: " })}</span>
          {t(job.checksterSays)}
        </p>
      </div>

      {state.status === "new" && (
        <div className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2">
          <button type="button" onClick={onSkip} className="h-12 px-4 rounded-2xl bg-sand hover:bg-line font-extrabold text-ink-soft" aria-label={t({ en: "Skip", ur: "چھوڑیں" })}>
            <X className="h-5 w-5" />
          </button>
          <button type="button" onClick={onCounter} className="h-12 rounded-2xl border-2 border-ink bg-white font-extrabold text-ink hover:bg-sky-soft">
            {t({ en: "My price", ur: "میری قیمت" })}
          </button>
          <button type="button" onClick={onAccept} className="h-12 rounded-2xl bg-leaf hover:brightness-95 text-white font-black">
            {t({ en: "Accept", ur: "قبول کریں" })}
          </button>
        </div>
      )}

      {state.status === "counter" && (
        <div className="mt-4 rounded-2xl bg-sky-soft p-3">
          <p className="text-sm font-extrabold text-sky-dark">{t({ en: "Your price for this job", ur: "اس کام کے لیے آپ کی قیمت" })}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" onClick={() => onPrice(Math.max(job.offer, state.price - 250))} className="h-11 w-11 rounded-full border-2 border-ink bg-white grid place-items-center" aria-label="-250">
              <Minus className="h-5 w-5" />
            </button>
            <span className="text-2xl font-black text-ink latin">{money(state.price)}</span>
            <button type="button" onClick={() => onPrice(state.price + 250)} className="h-11 w-11 rounded-full border-2 border-ink bg-white grid place-items-center" aria-label="+250">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <button type="button" onClick={onSendCounter} className="mt-3 w-full h-12 rounded-2xl bg-sky hover:bg-sky-dark text-white font-black">
            {t({ en: "Send my price", ur: "اپنی قیمت بھیجیں" })}
          </button>
        </div>
      )}

      {state.status === "sent" && (
        <p className="mt-4 rounded-2xl bg-sand p-3 font-bold text-ink-soft flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-sky opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky" />
          </span>
          {t({ en: "Sent. Waiting for the customer…", ur: "بھیج دیا۔ گاہک کا انتظار…" })} <span className="latin">{money(state.price)}</span>
        </p>
      )}
    </div>
  );
}
