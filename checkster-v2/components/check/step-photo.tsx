"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Camera, ImageIcon, Mic, MicOff, Plus, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CITIES, PROBLEMS, QUICK_PHRASES, ROOMS, type ProblemId } from "@/lib/data";
import { DemoTag } from "@/components/site/brand";
import { PROBLEM_ILL } from "@/components/site/illustrations";
import { Card, CardTitle, Chip } from "./shell";
import { PhotoView } from "./wall";

export interface Intake {
  problem: ProblemId;
  photo: string | null;
  usingSample: boolean;
  desc: string;
  room: string;
  city: string;
  area: number;
}

const SIZES = [
  { value: 10, label: { en: "Small — like a newspaper", ur: "چھوٹا — اخبار جتنا" } },
  { value: 40, label: { en: "Medium — like a door", ur: "درمیانہ — دروازے جتنا" } },
  { value: 100, label: { en: "Large — most of the wall", ur: "بڑا — تقریباً پوری دیوار" } },
];

export function StepPhoto({ intake, set }: { intake: Intake; set: (p: Partial<Intake>) => void }) {
  const { t, isUrdu } = useLang();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (intake.photo) URL.revokeObjectURL(intake.photo);
    set({ photo: URL.createObjectURL(f), usingSample: false });
  };

  // Speak instead of typing (works in Chrome on Android and desktop)
  const listen = () => {
    const w = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceMsg(t({ en: "Voice typing works in Google Chrome. Please type instead.", ur: "آواز سے لکھنا گوگل کروم میں کام کرتا ہے۔ براہ کرم لکھ دیں۔" }));
      return;
    }
    const rec = new SR();
    rec.lang = isUrdu ? "ur-PK" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = String(e.results?.[0]?.[0]?.transcript ?? "");
      if (text) set({ desc: (intake.desc ? intake.desc + " " : "") + text });
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setVoiceMsg(t({ en: "Couldn't hear you. Try again, or type.", ur: "آواز نہیں آئی۔ دوبارہ کوشش کریں، یا لکھ دیں۔" }));
    };
    setVoiceMsg("");
    setListening(true);
    rec.start();
  };

  const problem = PROBLEMS.find((p) => p.id === intake.problem)!;

  return (
    <div className="space-y-5">
      {/* 1. The photo — the most important thing on this screen */}
      <Card>
        <CardTitle>{t({ en: "1. Photo of the problem", ur: "1۔ مسئلے کی تصویر" })}</CardTitle>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files)} />
        <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files)} />

        {intake.photo || intake.usingSample ? (
          <div className="max-w-md mx-auto">
            <PhotoView src={intake.photo} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {intake.usingSample && <DemoTag />}
              <span className="text-sm font-bold text-ink-soft">
                {intake.usingSample ? t({ en: "Using our sample photo", ur: "ہماری نمونے کی تصویر" }) : t({ en: "Your photo", ur: "آپ کی تصویر" })}
              </span>
              <button
                type="button"
                onClick={() => galRef.current?.click()}
                className="ms-auto inline-flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-1.5 text-sm font-bold text-ink hover:border-ink"
              >
                <RefreshCw className="h-4 w-4" />
                {intake.usingSample ? t({ en: "Use my own photo", ur: "اپنی تصویر لگائیں" }) : t({ en: "Change photo", ur: "تصویر بدلیں" })}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => camRef.current?.click()}
              className="rounded-3xl border-[3px] border-dashed border-brand bg-brand-soft/60 hover:bg-brand-soft py-8 flex flex-col items-center gap-2 text-brand-dark"
            >
              <span className="h-16 w-16 rounded-full bg-brand text-white grid place-items-center">
                <Camera className="h-8 w-8" />
              </span>
              <span className="text-lg font-black">{t({ en: "Take a photo", ur: "تصویر کھینچیں" })}</span>
            </button>
            <button
              type="button"
              onClick={() => galRef.current?.click()}
              className="rounded-3xl border-[3px] border-dashed border-line bg-cream hover:border-ink py-8 flex flex-col items-center gap-2 text-ink"
            >
              <span className="h-16 w-16 rounded-full bg-white border-2 border-ink grid place-items-center">
                <ImageIcon className="h-8 w-8" />
              </span>
              <span className="text-lg font-black">{t({ en: "Choose from gallery", ur: "گیلری سے چنیں" })}</span>
            </button>
            <button
              type="button"
              onClick={() => set({ usingSample: true, photo: null })}
              className="sm:col-span-2 rounded-2xl bg-sun-soft hover:bg-sun py-3 font-extrabold text-ink"
            >
              {t({ en: "No photo right now? Use a sample photo", ur: "ابھی تصویر نہیں؟ نمونے کی تصویر استعمال کریں" })}
            </button>
          </div>
        )}
      </Card>

      {/* 2. What kind of problem */}
      <Card>
        <CardTitle>{t({ en: "2. What does it look like?", ur: "2۔ مسئلہ کیسا لگتا ہے؟" })}</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PROBLEMS.map((p) => {
            const Ill = PROBLEM_ILL[p.id];
            const on = intake.problem === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => set({ problem: p.id })}
                aria-pressed={on}
                className={`rounded-2xl border-2 p-2 pb-3 flex flex-col items-center text-center transition-colors ${
                  on ? "border-ink bg-sun-soft" : "border-line bg-white hover:border-ink"
                }`}
              >
                <Ill size={64} bg={p.danger ? "var(--danger-soft)" : undefined} />
                <span className="mt-1 text-sm font-extrabold text-ink leading-tight ur-tight">{t(p.title)}</span>
              </button>
            );
          })}
        </div>
        {problem.danger ? (
          <div className="mt-4 rounded-2xl bg-danger-soft border-2 border-danger p-4 flex gap-3">
            <AlertTriangle className="h-6 w-6 text-danger shrink-0" />
            <p className="font-bold text-ink">
              {t({
                en: "Sparks, a burning smell or a hot switch? Switch off the main breaker and call a qualified electrician now. Please don't wait for an app.",
                ur: "چنگاری، جلنے کی بو یا گرم سوئچ؟ مین بریکر بند کریں اور ابھی کسی مستند الیکٹریشن کو بلائیں۔ ایپ کا انتظار نہ کریں۔",
              })}
            </p>
          </div>
        ) : !problem.ready ? (
          <p className="mt-4 rounded-2xl bg-sand p-4 font-bold text-ink-soft">
            {t({
              en: "This check is coming soon. Right now Checkster can check seelan (damp walls).",
              ur: "یہ چیک جلد آ رہا ہے۔ ابھی چیکسٹر سیلن (نم دیواروں) کو چیک کر سکتا ہے۔",
            })}
          </p>
        ) : null}
      </Card>

      {/* 3. In your own words — optional */}
      <Card>
        <CardTitle sub={t({ en: "Optional. Type or speak, in Urdu or English.", ur: "اختیاری۔ اردو یا انگریزی میں لکھیں یا بولیں۔" })}>
          {t({ en: "3. Tell us in your words", ur: "3۔ اپنے الفاظ میں بتائیں" })}
        </CardTitle>
        <div className="flex gap-2 items-start">
          <textarea
            value={intake.desc}
            onChange={(e) => set({ desc: e.target.value })}
            rows={3}
            placeholder={t({ en: "e.g. The wall next to my bathroom is wet at the bottom and the paint is peeling off.", ur: "مثلاً میرے باتھ روم کے ساتھ والی دیوار نیچے سے گیلی ہے اور رنگ اکھڑ رہا ہے۔" })}
            className="flex-1 rounded-2xl border-2 border-line focus:border-ink outline-none p-3 text-lg font-semibold bg-cream/50"
          />
          <button
            type="button"
            onClick={listen}
            className={`h-14 w-14 shrink-0 rounded-2xl grid place-items-center border-2 ${
              listening ? "bg-brand border-brand text-white animate-pulse" : "bg-white border-ink text-ink hover:bg-sun-soft"
            }`}
            aria-label={t({ en: "Speak instead of typing", ur: "لکھنے کی بجائے بولیں" })}
            title={t({ en: "Speak instead of typing", ur: "لکھنے کی بجائے بولیں" })}
          >
            {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
        </div>
        {voiceMsg && <p className="mt-2 text-sm font-bold text-amber">{voiceMsg}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PHRASES.map((q) => (
            <button
              key={q.en}
              type="button"
              onClick={() => set({ desc: (intake.desc ? intake.desc.trim() + ". " : "") + t(q) })}
              className="inline-flex items-center gap-1 rounded-full bg-sand hover:bg-sun-soft px-3 py-1.5 text-sm font-bold text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              {t(q)}
            </button>
          ))}
        </div>
      </Card>

      {/* 4. Where and how big — all taps, no typing */}
      <Card>
        <CardTitle>{t({ en: "4. Where is it, and how big?", ur: "4۔ کہاں ہے، اور کتنا بڑا ہے؟" })}</CardTitle>
        <p className="font-extrabold text-ink-soft text-sm mb-2">{t({ en: "Room", ur: "کمرہ" })}</p>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map((r) => (
            <Chip key={r.id} active={intake.room === r.id} onClick={() => set({ room: r.id })}>
              {t(r.label)}
            </Chip>
          ))}
        </div>
        <p className="font-extrabold text-ink-soft text-sm mb-2 mt-5">{t({ en: "Size of the damp patch", ur: "سیلن والے حصے کا سائز" })}</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <Chip key={s.value} active={intake.area === s.value} onClick={() => set({ area: s.value })}>
              {t(s.label)}
            </Chip>
          ))}
        </div>
        <p className="font-extrabold text-ink-soft text-sm mb-2 mt-5">{t({ en: "City", ur: "شہر" })}</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Chip key={c.id} active={intake.city === c.id} onClick={() => set({ city: c.id })}>
              {t(c.label)}
            </Chip>
          ))}
        </div>
      </Card>
    </div>
  );
}
