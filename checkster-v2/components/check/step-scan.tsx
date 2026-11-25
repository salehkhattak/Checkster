"use client";

import { AlertTriangle, Check, Eye, Info, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Inspection } from "@/lib/api";
import { Card } from "./shell";
import { PhotoView } from "./wall";

const SEVERITY_LEVEL: Record<string, { bars: number; color: string; label: { en: string; ur: string } }> = {
  low: { bars: 2, color: "bg-leaf", label: { en: "Low — minor surface issue", ur: "کم — معمولی مسئلہ" } },
  moderate: {
    bars: 3,
    color: "bg-amber",
    label: { en: "Moderate — needs attention soon, not an emergency", ur: "درمیانہ — جلد توجہ چاہیے، ایمرجنسی نہیں" },
  },
  high: { bars: 4, color: "bg-brand", label: { en: "High — address promptly to avoid damage", ur: "زیادہ — نقصان سے بچنے کے لیے جلد مرمت کریں" } },
  critical: {
    bars: 5,
    color: "bg-danger",
    label: { en: "Critical — requires urgent professional inspection", ur: "انتہائی سنگین — فوری ماہر معائنہ ضروری ہے" },
  },
};

export function StepScan({
  photo,
  inspection,
  loading,
  error,
  onRetry,
}: {
  photo: string | null;
  inspection: Inspection | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const { t, isUrdu } = useLang();
  const sev = SEVERITY_LEVEL[inspection?.severity || "moderate"] || SEVERITY_LEVEL.moderate;

  return (
    <div className="grid gap-5 md:grid-cols-[1.05fr_1fr]">
      <div className="space-y-3">
        <PhotoView src={photo} boxes={inspection ? Math.min(3, inspection.observations.length) : 0} scanning={loading} />
        {inspection && (
          <div className="rounded-2xl bg-white border border-line p-3 text-xs font-bold text-ink-soft flex flex-wrap items-center justify-between gap-2">
            <span>
              {t({ en: "AI Vision Model:", ur: "اے آئی ماڈل:" })}{" "}
              <strong className="text-ink latin">{inspection.model}</strong>
            </span>
            {inspection.inspection_id && (
              <span className="latin">ID: {inspection.inspection_id}</span>
            )}
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-black text-ink ur-tight">
            {loading
              ? t({ en: "Gemini Vision is inspecting your photo…", ur: "جیمنائی وژن آپ کی تصویر کا معائنہ کر رہا ہے…" })
              : error
                ? t({ en: "Inspection could not complete", ur: "معائنہ مکمل نہیں ہو سکا" })
                : t({ en: "What the AI observed in your photo", ur: "اے آئی نے آپ کی تصویر میں کیا دیکھا" })}
          </h2>
          {inspection && (
            <span className="rounded-full bg-leaf-soft text-[#0f6b43] text-[11px] font-extrabold px-2.5 py-0.5">
              {t({ en: "Live Gemini AI", ur: "لائیو جیمنائی اے آئی" })}
            </span>
          )}
        </div>

        {loading && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-ink font-bold">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <span>
                {t({
                  en: "Analysing visible evidence, moisture patterns, plaster condition & safety risks…",
                  ur: "نمی کے نشانات، پلستر کی حالت اور حفاظتی خطرات کا تجزیہ ہو رہا ہے…",
                })}
              </span>
            </div>
            <p className="text-xs text-ink-soft font-semibold">
              {t({
                en: "Your photo is sent directly from the Checkster backend to Google Gemini and validated with Pydantic.",
                ur: "آپ کی تصویر محفوظ طریقے سے بیک اینڈ سے گوگل جیمنائی کو بھیجی جا رہی ہے۔",
              })}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-danger-soft border border-danger p-4 text-sm font-bold text-danger">
              {error}
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="h-12 px-5 rounded-2xl bg-ink text-white font-extrabold inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t({ en: "Retry AI Inspection", ur: "دوبارہ کوشش کریں" })}
            </button>
          </div>
        )}

        {inspection && !loading && (
          <div className="mt-4 space-y-4">
            {/* Summary */}
            <div className="rounded-2xl bg-cream border border-line p-3.5">
              <p className="text-xs font-extrabold text-ink-soft uppercase">
                {t({ en: "Summary", ur: "خلاصہ" })} · {inspection.issue_category.replace(/_/g, " ")}
              </p>
              <p className="mt-1 font-bold text-ink leading-snug">
                {isUrdu ? inspection.summary_ur || inspection.summary_en : inspection.summary_en}
              </p>
              {!isUrdu && inspection.summary_ur && (
                <p className="mt-1 text-sm font-bold text-ink-soft" dir="rtl">
                  {inspection.summary_ur}
                </p>
              )}
            </div>

            {/* Visible Observations & Evidence */}
            <div>
              <p className="text-xs font-extrabold text-ink-soft uppercase flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {t({ en: "Visible Evidence (Separated from Causes)", ur: "نظر آنے والے شواہد" })}
              </p>
              <ol className="mt-2 space-y-2.5">
                {inspection.observations.map((o, i) => (
                  <li key={i} className="rounded-2xl border border-line p-3 flex items-start gap-3">
                    <span className="h-7 w-7 shrink-0 rounded-full bg-sun border-2 border-ink font-black text-xs grid place-items-center latin">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-extrabold text-ink text-sm">{o.observation}</p>
                        <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-black text-ink latin">
                          {Math.round(o.confidence * 100)}% {t({ en: "conf.", ur: "اعتماد" })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink-soft mt-0.5">{o.evidence}</p>
                      {o.location_hint && (
                        <p className="text-[11px] font-bold text-sky-dark mt-0.5">
                          {t({ en: "Location in photo:", ur: "تصویر میں جگہ:" })} {o.location_hint}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Initial Possible Causes */}
            {inspection.possible_causes.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-ink-soft uppercase">
                  {t({ en: "Suspected Causes (Preliminary)", ur: "ممکنہ وجوہات (ابتدائی اندازہ)" })}
                </p>
                <div className="mt-2 space-y-2">
                  {inspection.possible_causes.map((c, idx) => (
                    <div key={idx} className="rounded-2xl bg-sand/70 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-ink">{c.cause}</span>
                        <span className="rounded-full bg-white border border-line px-2 py-0.5 text-xs font-black latin">
                          ~{Math.round(c.probability * 100)}% · {c.specialist}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink-soft mt-1">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Severity */}
            <div className="rounded-2xl bg-amber-soft p-4">
              <p className="text-sm font-extrabold text-[#8a5a00]">{t({ en: "Severity Assessment", ur: "شدت کا اندازہ" })}</p>
              <div className="mt-2 flex gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`h-3 flex-1 rounded-full ${n <= sev.bars ? sev.color : "bg-white"}`} />
                ))}
              </div>
              <p className="mt-2 font-extrabold text-ink text-sm">{t(sev.label)}</p>
              {inspection.severity_reason && (
                <p className="text-xs font-semibold text-ink-soft mt-0.5">{inspection.severity_reason}</p>
              )}
            </div>

            {/* Safety warnings */}
            {inspection.safety_warnings.length > 0 && (
              <div className="rounded-2xl bg-danger-soft border border-danger p-3.5 flex gap-2.5 items-start">
                <ShieldAlert className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-ink space-y-1">
                  {inspection.safety_warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Photograph limitations */}
            {inspection.limitations.length > 0 && (
              <div className="rounded-2xl bg-cream border border-line p-3 text-xs font-semibold text-ink-soft space-y-1">
                <p className="font-extrabold text-ink flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  {t({ en: "What a photograph cannot confirm:", ur: "تصویر سے کیا تصدیق نہیں ہو سکتا:" })}
                </p>
                <ul className="list-disc ps-4 space-y-0.5">
                  {inspection.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="flex items-center gap-2 text-sm font-bold text-leaf">
              <Check className="h-4 w-4" />
              {t({
                en: "Visual scan complete. Next: answer the follow-up questions for specialist diagnosis.",
                ur: "تصویر کا معائنہ مکمل۔ اب ماہرین کے سوالات کے جواب دیں۔",
              })}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
