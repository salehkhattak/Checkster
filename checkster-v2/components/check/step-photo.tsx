"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Camera, ImageIcon, Mic, MicOff, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AREAS, CITIES, PROBLEMS, QUICK_PHRASES, ROOMS, type ProblemId } from "@/lib/data";
import { DemoTag } from "@/components/site/brand";
import { PROBLEM_ILL } from "@/components/site/illustrations";
import { Card, CardTitle, Chip } from "./shell";
import { PhotoView } from "./wall";

export interface Intake {
  problem: ProblemId;
  photo: string | null;
  photos: string[];
  files: File[];
  usingSample: boolean;
  desc: string;
  room: string;
  city: string;
  neighbourhood: string;
  area: number;
  consent: boolean;
}

const SIZES = [
  { value: 15, label: { en: "Small (~15 sq ft)", ur: "چھوٹا (~15 مربع فٹ)" } },
  { value: 40, label: { en: "Medium (~40 sq ft)", ur: "درمیانہ (~40 مربع فٹ)" } },
  { value: 100, label: { en: "Large (~100 sq ft)", ur: "بڑا (~100 مربع فٹ)" } },
];

export function StepPhoto({ intake, set }: { intake: Intake; set: (p: Partial<Intake>) => void }) {
  const { t, isUrdu } = useLang();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");
  const [fileErr, setFileErr] = useState("");

  const pick = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFileErr("");
    const incoming = Array.from(fileList);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!f.type.startsWith("image/")) {
        setFileErr(t({ en: "Please upload image files (JPG, PNG, WEBP).", ur: "براہ کرم صرف تصویر اپ لوڈ کریں۔" }));
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setFileErr(t({ en: "Each image must be under 10 MB.", ur: "ہر تصویر 10 MB سے کم ہونی چاہیے۔" }));
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;
    const nextFiles = [...intake.files, ...valid].slice(0, 4);
    const nextUrls = nextFiles.map((f) => URL.createObjectURL(f));
    set({
      files: nextFiles,
      photos: nextUrls,
      photo: nextUrls[0] || null,
      usingSample: false,
    });
  };

  const removePhoto = (idx: number) => {
    const nextFiles = intake.files.filter((_, i) => i !== idx);
    const nextUrls = intake.photos.filter((_, i) => i !== idx);
    set({
      files: nextFiles,
      photos: nextUrls,
      photo: nextUrls[0] || null,
    });
  };

  // Speak instead of typing (works in Chrome on Android and desktop)
  const listen = () => {
    const w = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceMsg(
        t({
          en: "Voice typing works in Google Chrome. Please type instead.",
          ur: "آواز سے لکھنا گوگل کروم میں کام کرتا ہے۔ براہ کرم لکھ دیں۔",
        }),
      );
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
        <CardTitle
          sub={t({
            en: "Upload up to 4 photos (JPG, PNG, WEBP — max 10 MB each). EXIF GPS data is stripped automatically.",
            ur: "زیادہ سے زیادہ 4 تصاویر اپ لوڈ کریں۔ تصاویر سے لوکیشن ڈیٹا خودکار طور پر ہٹا دیا جاتا ہے۔",
          })}
        >
          {t({ en: "1. Photograph of the problem", ur: "1۔ مسئلے کی تصویر" })}
        </CardTitle>
        <input
          ref={camRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
        <input
          ref={galRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />

        {fileErr && (
          <p className="mb-3 rounded-xl bg-danger-soft text-danger px-3 py-2 text-sm font-bold">{fileErr}</p>
        )}

        {intake.photo || intake.usingSample ? (
          <div className="max-w-md mx-auto space-y-3">
            <PhotoView src={intake.photo} />
            {intake.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {intake.photos.map((url, idx) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      onClick={() => set({ photo: url })}
                      className="h-full w-full object-cover cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 end-1 h-6 w-6 rounded-full bg-white/90 grid place-items-center"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {intake.usingSample && <DemoTag />}
              <span className="text-sm font-bold text-ink-soft">
                {intake.usingSample
                  ? t({ en: "Using sample damp-wall image (sent to Gemini Vision)", ur: "نمونے کی تصویر (جیمنائی وژن کو بھیجی جائے گی)" })
                  : t({ en: `${intake.photos.length || 1} photo(s) ready`, ur: `${intake.photos.length || 1} تصویر تیار` })}
              </span>
              <button
                type="button"
                onClick={() => galRef.current?.click()}
                className="ms-auto inline-flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-1.5 text-sm font-bold text-ink hover:border-ink"
              >
                <RefreshCw className="h-4 w-4" />
                {intake.usingSample
                  ? t({ en: "Use my own photo", ur: "اپنی تصویر لگائیں" })
                  : t({ en: "Add / change photo", ur: "تصویر شامل کریں / بدلیں" })}
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
              onClick={() => set({ usingSample: true, photo: null, photos: [], files: [] })}
              className="sm:col-span-2 rounded-2xl bg-sun-soft hover:bg-sun py-3 font-extrabold text-ink"
            >
              {t({
                en: "No photo right now? Test live AI with our sample damp-wall image",
                ur: "ابھی تصویر نہیں؟ ہماری نمونے کی تصویر سے لائیو اے آئی چیک کریں",
              })}
            </button>
          </div>
        )}
      </Card>

      {/* 2. What kind of problem */}
      <Card>
        <CardTitle>{t({ en: "2. Select the issue category", ur: "2۔ مسئلہ کیسا لگتا ہے؟" })}</CardTitle>
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
        {problem.danger && (
          <div className="mt-4 rounded-2xl bg-danger-soft border-2 border-danger p-4 flex gap-3">
            <AlertTriangle className="h-6 w-6 text-danger shrink-0" />
            <div className="space-y-1">
              <p className="font-black text-danger">
                {t({ en: "Electrical Safety Warning — Do Not Touch", ur: "بجلی کا خطرہ — ہاتھ نہ لگائیں" })}
              </p>
              <p className="font-bold text-ink text-sm">
                {t({
                  en: "Sparks, burning smell, wet switches or exposed wiring? Switch off the main circuit breaker immediately and call a qualified electrician. Checkster does not encourage DIY electrical work.",
                  ur: "چنگاری، جلنے کی بو، گیلا سوئچ یا کھلی تاریں؟ مین بریکر فوراً بند کریں اور مستند الیکٹریشن کو بلائیں۔ خود بجلی کا کام ہرگز نہ کریں۔",
                })}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 3. In your own words — English, Urdu, or Roman Urdu */}
      <Card>
        <CardTitle
          sub={t({
            en: "Describe the issue in English, Urdu, or Roman Urdu (type or use voice).",
            ur: "اپنے الفاظ میں بتائیں — اردو، رومن اردو یا انگریزی میں لکھیں یا بولیں۔",
          })}
        >
          {t({ en: "3. Describe the problem", ur: "3۔ اپنے الفاظ میں بتائیں" })}
        </CardTitle>
        <div className="flex gap-2 items-start">
          <textarea
            value={intake.desc}
            onChange={(e) => set({ desc: e.target.value })}
            rows={3}
            placeholder={t({
              en: "e.g. Bathroom ke peeche wali deewar neeche se geeli hai aur rang utar raha hai…",
              ur: "مثلاً میرے باتھ روم کے ساتھ والی دیوار نیچے سے گیلی ہے اور رنگ اکھڑ رہا ہے۔",
            })}
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

      {/* 4. Where and how big */}
      <Card>
        <CardTitle>{t({ en: "4. Affected area & location", ur: "4۔ متاثرہ جگہ اور شہر" })}</CardTitle>
        <p className="font-extrabold text-ink-soft text-sm mb-2">{t({ en: "Affected room / area", ur: "کمرہ / جگہ" })}</p>
        <div className="flex flex-wrap gap-2">
          {[...ROOMS, { id: "roof", label: { en: "Roof / Terrace", ur: "چھت" } }].map((r) => (
            <Chip key={r.id} active={intake.room === r.id} onClick={() => set({ room: r.id })}>
              {t(r.label)}
            </Chip>
          ))}
        </div>

        <p className="font-extrabold text-ink-soft text-sm mb-2 mt-5">
          {t({ en: "Approximate affected size", ur: "متاثرہ حصے کا سائز" })}
        </p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <Chip key={s.value} active={intake.area === s.value} onClick={() => set({ area: s.value })}>
              {t(s.label)}
            </Chip>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          <div>
            <p className="font-extrabold text-ink-soft text-sm mb-2">{t({ en: "City", ur: "شہر" })}</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <Chip key={c.id} active={intake.city === c.id} onClick={() => set({ city: c.id })}>
                  {t(c.label)}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="font-extrabold text-ink-soft text-sm mb-2">{t({ en: "Neighbourhood / Area", ur: "محلہ / علاقہ" })}</p>
            <input
              value={intake.neighbourhood}
              onChange={(e) => set({ neighbourhood: e.target.value })}
              placeholder={t({ en: "e.g. Hayatabad Phase 3", ur: "مثلاً حیات آباد فیز 3" })}
              className="w-full h-11 rounded-2xl border-2 border-line focus:border-ink outline-none px-3 font-bold bg-cream/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {AREAS.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => set({ neighbourhood: a.label.en })}
                  className="text-xs font-bold rounded-full bg-sand hover:bg-sun-soft px-2.5 py-1 text-ink"
                >
                  {t(a.label)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Privacy & AI Consent */}
      <Card className="bg-sun-soft/60 border-ink">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={intake.consent}
            onChange={(e) => set({ consent: e.target.checked })}
            className="mt-1 h-5 w-5 accent-brand rounded"
          />
          <span className="text-sm font-bold text-ink leading-snug">
            <span className="inline-flex items-center gap-1 font-black">
              <ShieldCheck className="h-4 w-4 text-leaf" />
              {t({ en: "AI Processing Consent:", ur: "اے آئی تجزیے کی اجازت:" })}
            </span>{" "}
            {t({
              en: "I consent to Checkster sending my uploaded photograph(s) and description securely to Google Gemini for preliminary visual analysis. Photos are stripped of GPS metadata and stored privately.",
              ur: "میں اجازت دیتا/دیتی ہوں کہ میری اپ لوڈ کردہ تصویر اور تفصیل ابتدائی تجزیے کے لیے محفوظ طریقے سے گوگل جیمنائی کو بھیجی جائے۔",
            })}
          </span>
        </label>
      </Card>
    </div>
  );
}
