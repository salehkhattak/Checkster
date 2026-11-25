"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  FileUp,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  Power,
  Ruler,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { AREAS, CITIES, JOB_REQUESTS, TRADES, officialDayRange, tradeLabel, type JobRequest, type Trade } from "@/lib/data";
import { api, type ContractorListing, type RepairRequestRecord } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DemoTag, LangToggle, Logo, Mascot, OfficialTag } from "@/components/site/brand";
import { PROBLEM_ILL, TradePicture } from "@/components/site/illustrations";
import { BackButton, Card, CardTitle, Chip, Hint, PrimaryButton } from "@/components/check/shell";

const GUIDE: Tx[] = [
  {
    en: "Salaam, ustad! What work do you do? Tap one or more service categories.",
    ur: "السلام علیکم استاد! آپ کیا کام کرتے ہیں؟ ایک یا زیادہ پر ٹیپ کریں۔",
  },
  {
    en: "Your business name, phone number, city, and the areas where you work.",
    ur: "آپ کا نام، فون نمبر اور وہ علاقے جہاں آپ کام کرتے ہیں۔",
  },
  {
    en: "Set your daily rate, add work photos, and submit supporting info for Checkster verification.",
    ur: "اپنا یومیہ ریٹ لگائیں اور تصدیق کے لیے معلومات جمع کروائیں۔",
  },
  {
    en: "Your Contractor Dashboard: manage availability, verification status, and customer repair requests.",
    ur: "آپ کا کاریگر ڈیش بورڈ: اپنی دستیابی اور گاہکوں کی درخواستیں منظم کریں۔",
  },
];

interface Profile {
  trades: Trade[];
  businessName: string;
  name: string;
  phone: string;
  city: string;
  neighbourhood: string;
  areas: string[];
  years: number;
  rate: number;
  description: string;
  photos: string[];
}

export function WorkerApp() {
  const { t } = useLang();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({
    trades: [],
    businessName: "",
    name: "",
    phone: "",
    city: "peshawar",
    neighbourhood: "Hayatabad",
    areas: ["hayatabad"],
    years: 5,
    rate: 2000,
    description: "",
    photos: [],
  });
  const [nudge, setNudge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedContractor, setSavedContractor] = useState<ContractorListing | null>(null);
  const [realRequests, setRealRequests] = useState<RepairRequestRecord[]>([]);
  const [realReviews, setRealReviews] = useState<{ id: string; user_name: string; rating: number; review: string; created_at: string }[]>([]);

  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  const loadExistingProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getMyContractor();
      if (res.contractor) {
        const c = res.contractor;
        setSavedContractor(c);
        setRealRequests(res.requests || []);
        setRealReviews(res.reviews || []);
        setP((prev) => ({
          ...prev,
          businessName: c.business_name,
          name: c.owner_name || user.name,
          phone: c.phone || "",
          city: c.city,
          neighbourhood: c.neighbourhood || "",
          trades: (c.service_categories as Trade[]) || ["plumber"],
          years: c.experience_years || 5,
          rate: c.daily_rate || 2000,
          description: c.description || "",
          areas: c.working_areas || ["hayatabad"],
        }));
        setStep(3);
      } else {
        setP((prev) => ({
          ...prev,
          name: user.name,
          phone: user.phone || "",
          city: user.city || "peshawar",
          neighbourhood: user.neighbourhood || "Hayatabad",
        }));
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    loadExistingProfile();
  }, [loadExistingProfile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNudge(false);
  }, [step]);

  const persistProfileAndGoDashboard = async () => {
    setSaveError("");
    if (user) {
      setSaving(true);
      try {
        const res = await api.registerContractor({
          business_name: p.businessName.trim() || `${p.name.trim()} (${p.trades.join(", ")})`,
          owner_name: p.name.trim(),
          phone: p.phone.trim(),
          service_categories: p.trades,
          experience_years: p.years,
          daily_rate: p.rate,
          description: p.description.trim(),
          city: p.city,
          neighbourhood: p.neighbourhood,
          working_areas: p.areas,
          is_available: true,
        });
        setSavedContractor(res.contractor);
        await loadExistingProfile();
      } catch (err) {
        setSaveError((err as Error).message);
      } finally {
        setSaving(false);
      }
    }
    setStep(3);
  };

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
        <PrimaryButton tone="sky" onClick={persistProfileAndGoDashboard}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {t({ en: "Save Profile & Open Dashboard", ur: "پروفائل محفوظ کریں اور ڈیش بورڈ کھولیں" })}{" "}
          <ArrowRight className="h-5 w-5 flip-rtl" />
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
            {user ? (
              <Link href="/dashboard" className="text-xs font-extrabold rounded-full border border-ink px-3 py-1.5 text-ink">
                {user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link href="/register" className="text-xs font-extrabold rounded-full bg-sky text-white px-3 py-1.5">
                {t({ en: "Create Account", ur: "اکاؤنٹ بنائیں" })}
              </Link>
            )}
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
              <span
                key={i}
                className={`h-2.5 rounded-full transition-all ${
                  i === step ? "w-10 bg-sky" : i < step ? "w-5 bg-leaf" : "w-5 bg-[#d6e8f6]"
                }`}
              />
            ))}
          </div>
        )}
        <div className="mt-5 flex items-end gap-3" aria-live="polite">
          <Mascot size={52} className="shrink-0" />
          <div className="rounded-2xl rounded-bl-md rtl:rounded-bl-2xl rtl:rounded-br-md bg-white border-2 border-ink px-4 py-3 font-bold text-ink leading-snug">
            {t(GUIDE[step])}
          </div>
        </div>

        {saveError && (
          <div className="mt-4 rounded-2xl bg-danger-soft border border-danger p-3 text-sm font-bold text-danger">
            {saveError}
          </div>
        )}

        <div className="mt-6">
          {step === 0 && <TradesStep p={p} set={set} />}
          {step === 1 && <DetailsStep p={p} set={set} nudge={nudge} />}
          {step === 2 && <RateStep p={p} set={set} />}
          {step === 3 && (
            <Dashboard
              p={p}
              contractor={savedContractor}
              realRequests={realRequests}
              realReviews={realReviews}
              onEditProfile={() => setStep(0)}
              onRefresh={loadExistingProfile}
            />
          )}
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
  const toggle = (id: Trade) =>
    set({ trades: p.trades.includes(id) ? p.trades.filter((x) => x !== id) : [...p.trades, id] });
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
          {t({ en: "Your full name", ur: "آپ کا نام" })}
        </label>
        <input
          id="w-name"
          value={p.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={t({ en: "e.g. Ustad Rahim Khan", ur: "مثلاً استاد رحیم خان" })}
          className={`mt-2 w-full h-14 rounded-2xl border-2 ${
            nameBad ? "border-danger" : "border-line"
          } focus:border-ink outline-none px-4 text-lg font-bold`}
        />
        {nameBad && <p className="mt-1 text-sm font-bold text-danger">{t({ en: "Please write your name", ur: "براہ کرم اپنا نام لکھیں" })}</p>}

        <label className="block font-black text-ink text-lg mt-4" htmlFor="w-bname">
          {t({ en: "Business / Shop name (optional)", ur: "دکان یا کاروبار کا نام (اختیاری)" })}
        </label>
        <input
          id="w-bname"
          value={p.businessName}
          onChange={(e) => set({ businessName: e.target.value })}
          placeholder={t({ en: "e.g. Rahim Plumbing & Seepage Works", ur: "مثلاً رحیم پلمبنگ ورکس" })}
          className="mt-2 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold"
        />

        <label className="block font-black text-ink text-lg mt-4" htmlFor="w-phone">
          {t({ en: "Mobile number", ur: "موبائل نمبر" })}
        </label>
        <div
          className={`mt-2 flex items-center h-14 rounded-2xl border-2 ${
            phoneBad ? "border-danger" : "border-line"
          } focus-within:border-ink overflow-hidden`}
          dir="ltr"
        >
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
        {phoneBad && (
          <p className="mt-1 text-sm font-bold text-danger">
            {t({ en: "Please write a 10-digit number", ur: "براہ کرم 10 ہندسوں کا نمبر لکھیں" })}
          </p>
        )}

        <label className="block font-black text-ink text-lg mt-4" htmlFor="w-desc">
          {t({ en: "Short description of your services", ur: "اپنے کام کی مختصر تفصیل" })}
        </label>
        <textarea
          id="w-desc"
          rows={2}
          value={p.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder={t({ en: "e.g. Pipe pressure testing, bathroom leakage & DPC repair", ur: "مثلاً پائپ پریشر ٹیسٹ، سیلن اور لیکیج کی مرمت" })}
          className="mt-2 w-full rounded-2xl border-2 border-line focus:border-ink outline-none p-3 font-bold"
        />
      </Card>

      <Card>
        <CardTitle>{t({ en: "City & working areas", ur: "شہر اور کام کے علاقے" })}</CardTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {CITIES.map((c) => (
            <Chip key={c.id} active={p.city === c.id} onClick={() => set({ city: c.id })}>
              {t(c.label)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip
              key={a.id}
              active={p.areas.includes(a.id)}
              onClick={() =>
                set({ areas: p.areas.includes(a.id) ? p.areas.filter((x) => x !== a.id) : [...p.areas, a.id] })
              }
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
        <CardTitle
          sub={t({
            en: "You can always change it. Customers can also offer their own price.",
            ur: "آپ اسے کبھی بھی بدل سکتے ہیں۔ گاہک بھی اپنی قیمت لگا سکتے ہیں۔",
          })}
        >
          {t({ en: "Your daily rate", ur: "آپ کا یومیہ ریٹ" })}
        </CardTitle>
        <Stepper value={p.rate} onChange={(n) => set({ rate: Math.max(500, n) })} step={100} display={money(p.rate)} />
        <div className="mt-4 rounded-2xl bg-leaf-soft p-4 flex flex-wrap items-center gap-2">
          <OfficialTag />
          <p className="font-bold text-ink">
            {t(tradeLabel(main))}: <span className="latin">{money(lo)} – {money(hi)}</span> {t({ en: "per day", ur: "فی دن" })}
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle
          sub={t({
            en: "Customers trust kaarigars who show their work. Up to 4 photos.",
            ur: "گاہک ان کاریگروں پر بھروسا کرتے ہیں جو اپنا کام دکھاتے ہیں۔ زیادہ سے زیادہ 4 تصاویر۔",
          })}
        >
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
            >
              <Camera className="h-8 w-8" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  step,
  display,
}: {
  value: number;
  onChange: (n: number) => void;
  step: number;
  display: string;
}) {
  return (
    <div className="mt-3 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(value - step)}
        className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sky-soft"
      >
        <Minus className="h-6 w-6" />
      </button>
      <span className="text-4xl font-black text-ink min-w-[8rem] text-center latin whitespace-nowrap">{display}</span>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sky-soft"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

// ---------------- dashboard: verification workflow + incoming jobs ----------------
type JobState = { status: "new" | "counter" | "sent" | "confirmed" | "skipped"; price: number };

function Dashboard({
  p,
  contractor,
  realRequests,
  realReviews,
  onEditProfile,
  onRefresh,
}: {
  p: Profile;
  contractor: ContractorListing | null;
  realRequests: RepairRequestRecord[];
  realReviews: { id: string; user_name: string; rating: number; review: string; created_at: string }[];
  onEditProfile: () => void;
  onRefresh: () => void;
}) {
  const { t, money } = useLang();
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [verNotes, setVerNotes] = useState("");
  const [verDoc, setVerDoc] = useState<File | null>(null);
  const [verMsg, setVerMsg] = useState("");
  const [verBusy, setVerBusy] = useState(false);

  const [jobs, setJobs] = useState<Record<string, JobState>>(() =>
    Object.fromEntries(JOB_REQUESTS.map((j) => [j.id, { status: "new", price: j.offer }])),
  );
  const update = (id: string, s: Partial<JobState>) => setJobs((x) => ({ ...x, [id]: { ...x[id], ...s } }));

  const send = (id: string, price: number) => {
    update(id, { status: "sent", price });
    setTimeout(() => update(id, { status: "confirmed" }), 1200);
  };

  const handleSubmitVerification = async (e: FormEvent) => {
    e.preventDefault();
    setVerBusy(true);
    setVerMsg("");
    try {
      await api.submitVerification(verNotes, verDoc);
      setVerMsg(t({ en: "Verification submitted! An administrator will review it.", ur: "تصدیق کی درخواست جمع ہو گئی! ایڈمن اس کا جائزہ لے گا۔" }));
      onRefresh();
    } catch (err) {
      setVerMsg((err as Error).message);
    } finally {
      setVerBusy(false);
    }
  };

  const handleRealRequestAction = async (reqId: string, status: "accepted" | "countered" | "rejected", counterPrice?: number) => {
    try {
      await api.updateRepairRequest(reqId, { status, counter_price: counterPrice });
      onRefresh();
    } catch {
      /* ignore */
    }
  };

  const confirmed = JOB_REQUESTS.filter((j) => jobs[j.id].status === "confirmed");
  const earnings = confirmed.reduce((s, j) => s + jobs[j.id].price, 0);
  const initials = (p.name.trim() || "Kaarigar")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const verStatus = contractor?.verification_status || "pending";

  return (
    <div className="space-y-5">
      <Card className="border-[#d6e8f6]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="h-16 w-16 rounded-full bg-sky text-white text-2xl font-black grid place-items-center border-2 border-ink latin">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xl font-black text-ink truncate">
                {contractor?.business_name || p.businessName || p.name.trim() || t({ en: "Kaarigar", ur: "کاریگر" })}
              </p>
              {verStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft text-[#0f6b43] text-xs font-extrabold px-2.5 py-0.5">
                  <BadgeCheck className="h-3.5 w-3.5" /> {t({ en: "Checkster Verified", ur: "چیکسٹر تصدیق شدہ" })}
                </span>
              ) : (
                <span className="rounded-full bg-amber-soft text-[#8a5a00] text-xs font-extrabold px-2.5 py-0.5 uppercase">
                  {t({ en: `Verification: ${verStatus}`, ur: `تصدیق: ${verStatus}` })}
                </span>
              )}
            </div>
            <p className="text-ink-soft font-bold">
              {(p.trades.length ? p.trades : (["plumber"] as Trade[])).map((tr) => t(tradeLabel(tr))).join(" · ")}
            </p>
            <p className="text-sm text-ink-soft font-semibold">
              <span className="latin">{money(p.rate)}</span> {t({ en: "per day", ur: "فی دن" })} · {p.years}{" "}
              {t({ en: "yrs experience", ur: "سال تجربہ" })} · {p.city.toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className="rounded-xl border-2 border-line hover:border-ink px-3 py-1.5 text-xs font-extrabold text-ink"
          >
            {t({ en: "Edit Profile", ur: "پروفائل بدلیں" })}
          </button>
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
            {online
              ? t({ en: "You're online. Jobs are coming in.", ur: "آپ آن لائن ہیں۔ کام آ رہے ہیں۔" })
              : t({ en: "You're offline. Tap to go online.", ur: "آپ آف لائن ہیں۔ آن لائن ہونے کے لیے ٹیپ کریں۔" })}
          </span>
          <span className={`h-8 w-14 rounded-full p-1 transition-colors ${online ? "bg-white/30" : "bg-sand"}`}>
            <span
              className={`block h-6 w-6 rounded-full bg-white border-2 border-ink transition-transform ${
                online ? "translate-x-6 rtl:-translate-x-6" : ""
              }`}
            />
          </span>
        </button>
      </Card>

      {/* Contractor Verification Submission Workflow */}
      {user && verStatus !== "verified" && (
        <Card className="border-sky">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-dark" />
            <h3 className="text-lg font-black text-ink">
              {t({ en: "Submit Supporting Info for Checkster Verification", ur: "چیکسٹر تصدیق شدہ بیج کے لیے درخواست دیں" })}
            </h3>
          </div>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {t({
              en: "Status flow: Pending → Submitted → Under Review → Verified / Rejected. An administrator reviews your submission before granting a verified badge.",
              ur: "مراحل: زیر التواء ← جمع شدہ ← زیر جائزہ ← تصدیق شدہ۔ ایڈمن جائزہ لینے کے بعد تصدیق شدہ بیج جاری کرتا ہے۔",
            })}
          </p>
          {verMsg && <p className="mt-2 rounded-xl bg-leaf-soft text-[#0f6b43] px-3 py-2 text-xs font-bold">{verMsg}</p>}
          <form onSubmit={handleSubmitVerification} className="mt-3 space-y-3">
            <input
              value={verNotes}
              onChange={(e) => setVerNotes(e.target.value)}
              required
              placeholder={t({
                en: "Trade reference, shop registration or experience details…",
                ur: "دکان کا حوالہ، رجسٹریشن یا تجربے کی تفصیل لکھیں…",
              })}
              className="w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 text-sm font-bold"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-extrabold text-ink cursor-pointer inline-flex items-center gap-1.5">
                <FileUp className="h-4 w-4" />
                {verDoc ? verDoc.name : t({ en: "Attach supporting document (optional)", ur: "دستاویز منسلک کریں (اختیاری)" })}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setVerDoc(e.target.files?.[0] || null)} />
              </label>
              <button
                type="submit"
                disabled={verBusy}
                className="ms-auto h-10 px-4 rounded-xl bg-sky hover:bg-sky-dark text-white text-xs font-black"
              >
                {verBusy ? t({ en: "Submitting…", ur: "جمع ہو رہا ہے…" }) : t({ en: "Submit for Verification", ur: "تصدیق کے لیے جمع کروائیں" })}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Real Incoming Repair Requests from Database */}
      {realRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-black text-ink">
            {t({ en: "Customer Repair Requests (Live Database)", ur: "گاہکوں کی مرمت کی درخواستیں" })}
          </h2>
          {realRequests.map((r) => (
            <Card key={r.id} className="border-leaf space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-xs font-extrabold text-ink uppercase">
                    {r.trade} · {r.status}
                  </span>
                  <p className="text-lg font-black text-ink mt-1">{r.title}</p>
                  <p className="text-xs font-bold text-ink-soft">
                    {r.neighbourhood ? `${r.neighbourhood}, ` : ""}
                    {r.city} · {r.scheduled_date}
                  </p>
                </div>
                <p className="text-2xl font-black text-ink latin">{money(r.offered_price)}</p>
              </div>
              {r.status === "open" && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRealRequestAction(r.id, "accepted")}
                    className="h-10 px-4 rounded-xl bg-leaf text-white text-xs font-black"
                  >
                    {t({ en: "Accept Request", ur: "قبول کریں" })}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRealRequestAction(r.id, "countered", r.offered_price + 500)}
                    className="h-10 px-4 rounded-xl border border-ink bg-white text-ink text-xs font-black"
                  >
                    {t({ en: `Counter (${money(r.offered_price + 500)})`, ur: "اپنی قیمت بھیجیں" })}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRealRequestAction(r.id, "rejected")}
                    className="h-10 px-4 rounded-xl bg-sand text-ink-soft text-xs font-black"
                  >
                    {t({ en: "Reject", ur: "رد کریں" })}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Demo Job Requests */}
      {online ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-ink">{t({ en: "Sample Jobs Near You", ur: "آپ کے قریب نمونہ کام" })}</h2>
            <DemoTag />
          </div>
          {JOB_REQUESTS.filter((j) => jobs[j.id].status !== "skipped").map((j, i) => (
            <JobCard
              key={j.id}
              job={j}
              state={jobs[j.id]}
              delay={i * 250}
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
          <p className="mt-3 font-bold text-ink-soft">
            {t({ en: "Go online to see job requests near you.", ur: "اپنے قریب کام کی درخواستیں دیکھنے کے لیے آن لائن ہوں۔" })}
          </p>
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

      <div className="mt-3 rounded-2xl bg-sun-soft p-3 flex gap-2 items-start">
        <Mascot size={28} className="shrink-0" />
        <p className="text-sm font-bold text-ink">
          <span className="text-ink-soft">{t({ en: "Checkster says: ", ur: "چیکسٹر کہتا ہے: " })}</span>
          {t(job.checksterSays)}
        </p>
      </div>

      {state.status === "new" && (
        <div className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="h-12 px-4 rounded-2xl bg-sand hover:bg-line font-extrabold text-ink-soft"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onCounter}
            className="h-12 rounded-2xl border-2 border-ink bg-white font-extrabold text-ink hover:bg-sky-soft"
          >
            {t({ en: "My price", ur: "میری قیمت" })}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="h-12 rounded-2xl bg-leaf hover:brightness-95 text-white font-black"
          >
            {t({ en: "Accept", ur: "قبول کریں" })}
          </button>
        </div>
      )}

      {state.status === "counter" && (
        <div className="mt-4 rounded-2xl bg-sky-soft p-3">
          <p className="text-sm font-extrabold text-sky-dark">{t({ en: "Your price for this job", ur: "اس کام کے لیے آپ کی قیمت" })}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onPrice(Math.max(job.offer, state.price - 250))}
              className="h-11 w-11 rounded-full border-2 border-ink bg-white grid place-items-center"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="text-2xl font-black text-ink latin">{money(state.price)}</span>
            <button
              type="button"
              onClick={() => onPrice(state.price + 250)}
              className="h-11 w-11 rounded-full border-2 border-ink bg-white grid place-items-center"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onSendCounter}
            className="mt-3 w-full h-12 rounded-2xl bg-sky hover:bg-sky-dark text-white font-black"
          >
            {t({ en: "Send my price", ur: "اپنی قیمت بھیجیں" })}
          </button>
        </div>
      )}
    </div>
  );
}
