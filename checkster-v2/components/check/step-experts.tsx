"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, MessageSquare, Send, ShieldAlert, Wrench } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ANSWER_LABEL, SAFETY_NOTE, tradeLabel, type Answer, type Trade } from "@/lib/data";
import { api, type Diagnosis, type Inspection, type Lang3 } from "@/lib/api";
import { Mascot } from "@/components/site/brand";
import { TradePicture } from "@/components/site/illustrations";
import { Card, CardTitle } from "./shell";

export type Answers = Record<string, string>;

const SPECIALIST_TRADE_MAP: Record<string, Trade> = {
  plumbing: "plumber",
  masonry: "mason",
  waterproofing: "waterproofing",
  general: "mason",
  electrical: "electrician",
};

export function StepExperts({
  inspection,
  answers,
  setAnswer,
  diagnosis,
  refining,
  refineError,
  onRunRefine,
  language,
}: {
  inspection: Inspection | null;
  answers: Answers;
  setAnswer: (id: string, val: string) => void;
  diagnosis: Diagnosis | null;
  refining: boolean;
  refineError: string;
  onRunRefine: () => void;
  language: Lang3;
}) {
  const { t, isUrdu } = useLang();
  const [customQ, setCustomQ] = useState("");
  const [customAns, setCustomAns] = useState<{ answer_en: string; answer_ur: string } | null>(null);
  const [asking, setAsking] = useState(false);

  const questions = inspection?.additional_questions?.length
    ? inspection.additional_questions
    : [
        {
          id: "bathroom",
          question_en: "Is there a bathroom, kitchen, or water pipe behind this wall?",
          question_ur: "کیا اس دیوار کے پیچھے باتھ روم، کچن یا پانی کا پائپ ہے؟",
          why: "Helps distinguish concealed plumbing leaks from exterior rain or ground damp.",
        },
        {
          id: "rain",
          question_en: "Does the dampness or damage become worse after rainfall?",
          question_ur: "کیا بارش کے بعد یہ مسئلہ بڑھ جاتا ہے؟",
          why: "Indicates whether exterior waterproofing or roof drainage is involved.",
        },
      ];

  const allAnswered = questions.every((q) => Boolean(answers[q.id]));

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    if (!customQ.trim()) return;
    setAsking(true);
    try {
      const res = await api.askFollowup(
        customQ.trim(),
        { inspection, answers, diagnosis },
        language,
      );
      setCustomAns(res);
    } catch {
      /* ignore */
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Grounded Follow-up Questions from Gemini */}
      <Card>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Mascot size={44} />
            <div>
              <h2 className="text-xl font-black text-ink ur-tight">
                {t({ en: "Follow-up questions to narrow down the cause", ur: "وجہ جاننے کے لیے چند اہم سوالات" })}
              </h2>
              <p className="text-xs font-bold text-ink-soft">
                {t({
                  en: "Based on the visual evidence in your photo, our specialist coordinator needs these answers:",
                  ur: "آپ کی تصویر کے شواہد کی بنیاد پر ماہرین کو ان سوالات کے جواب درکار ہیں:",
                })}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-leaf-soft text-[#0f6b43] text-[11px] font-extrabold px-2.5 py-0.5">
            {t({ en: "Evidence-Grounded", ur: "شواہد پر مبنی" })}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {questions.map((q, idx) => {
            const current = answers[q.id] || "";
            return (
              <div key={q.id} className="rounded-2xl bg-cream border border-line p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-ink text-white text-xs font-black grid place-items-center shrink-0 latin">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-extrabold text-ink">
                      {isUrdu ? q.question_ur || q.question_en : q.question_en}
                    </p>
                    {!isUrdu && q.question_ur && (
                      <p className="text-sm font-bold text-ink-soft mt-0.5" dir="rtl">
                        {q.question_ur}
                      </p>
                    )}
                    {q.why && (
                      <p className="text-xs font-semibold text-ink-soft mt-1">
                        {t({ en: "Why we ask:", ur: "وجہ:" })} {q.why}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-md ps-8">
                  {(["yes", "no", "unsure"] as Answer[]).map((a) => {
                    const active = current === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAnswer(q.id, a)}
                        className={`h-11 rounded-xl border-2 font-black text-sm transition-colors ${
                          active
                            ? "border-ink bg-sun text-ink shadow-[0_2px_0_0_var(--ink)]"
                            : "border-line bg-white text-ink hover:border-ink"
                        }`}
                      >
                        {t(ANSWER_LABEL[a])}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <button
            type="button"
            disabled={!allAnswered || refining}
            onClick={onRunRefine}
            className="w-full h-14 rounded-2xl bg-ink hover:bg-black disabled:opacity-45 text-white text-lg font-black inline-flex items-center justify-center gap-2"
          >
            {refining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t({ en: "Coordinator consulting specialists…", ur: "ماہرین کا مشترکہ تجزیہ جاری ہے…" })}
              </>
            ) : (
              <>
                <Wrench className="h-5 w-5" />
                {diagnosis
                  ? t({ en: "Update Specialist Diagnosis", ur: "ماہرین کی رائے اپ ڈیٹ کریں" })
                  : t({ en: "Get Final Specialist Diagnosis", ur: "ماہرین کا حتمی فیصلہ حاصل کریں" })}
              </>
            )}
          </button>
          {!allAnswered && (
            <p className="mt-2 text-center text-xs font-bold text-ink-soft">
              {t({ en: "Tap an answer for each question above to run the specialist synthesis.", ur: "اوپر ہر سوال کا جواب منتخب کریں۔" })}
            </p>
          )}
          {refineError && (
            <p className="mt-3 rounded-xl bg-danger-soft text-danger p-3 text-sm font-bold">{refineError}</p>
          )}
        </div>
      </Card>

      {/* 2. Specialist Coordinator Final Diagnosis */}
      {diagnosis && (
        <div className="rounded-3xl bg-white border-2 border-ink p-5 sm:p-6 space-y-5 pop-in">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-leaf" />
              <h3 className="font-black text-ink text-xl">
                {t({ en: "Coordinator & Specialist Diagnosis", ur: "ماہرین کا حتمی معائنہ اور تشخیص" })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-soft text-sky-dark text-xs font-extrabold px-3 py-1">
                {diagnosis.confidence_label.toUpperCase()} ({Math.round(diagnosis.confidence * 100)}%)
              </span>
              {diagnosis.professional_inspection_required && (
                <span className="rounded-full bg-amber-soft text-[#8a5a00] text-xs font-extrabold px-3 py-1">
                  {t({ en: "On-site check advised", ur: "موقع پر معائنہ ضروری" })}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold text-ink-soft uppercase">
              {t({ en: "Most likely cause", ur: "سب سے زیادہ ممکنہ وجہ" })}
            </p>
            <p className="text-2xl font-black text-ink leading-tight ur-tight mt-0.5">
              {isUrdu ? diagnosis.final_cause_ur || diagnosis.final_cause : diagnosis.final_cause}
            </p>
            {!isUrdu && diagnosis.final_cause_ur && (
              <p className="text-base font-bold text-ink-soft mt-1" dir="rtl">
                {diagnosis.final_cause_ur}
              </p>
            )}
            <p className="mt-2 text-sm font-semibold text-ink-soft leading-relaxed">{diagnosis.cause_explanation}</p>
          </div>

          {/* Grounded Specialist Assessments (Plumbing / Masonry / Waterproofing / General / Electrical) */}
          {diagnosis.specialists_consulted.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-extrabold text-ink-soft uppercase">
                {t({ en: "Specialist Assessments (Grounded in Photo & Answers)", ur: "متعلقہ ماہرین کی رائے" })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {diagnosis.specialists_consulted.map((sp, i) => {
                  const tr = SPECIALIST_TRADE_MAP[sp.specialist] || "mason";
                  return (
                    <div key={i} className="rounded-2xl bg-cream border border-line p-3.5 flex gap-3 items-start">
                      <TradePicture trade={tr} size={42} bg="#fff" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase text-ink">{sp.specialist} specialist</p>
                          <span
                            className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${
                              sp.agrees ? "bg-leaf-soft text-[#0f6b43]" : "bg-amber-soft text-[#8a5a00]"
                            }`}
                          >
                            {sp.agrees ? t({ en: "Primary", ur: "متفق" }) : t({ en: "Secondary", ur: "متبادل" })}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-brand-dark mt-0.5">{sp.supports_cause}</p>
                        <p className="text-xs font-semibold text-ink-soft mt-1 leading-snug">{sp.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {diagnosis.conflicts_resolved && (
                <p className="text-xs font-bold text-ink-soft bg-sand/70 rounded-xl px-3 py-2">
                  <strong>{t({ en: "Coordinator resolution:", ur: "ماہرین کا اتفاق:" })}</strong>{" "}
                  {diagnosis.conflicts_resolved}
                </p>
              )}
            </div>
          )}

          {/* Recommended Repair Plan */}
          <div>
            <p className="text-xs font-extrabold text-ink-soft uppercase">
              {t({ en: "Recommended Repair Sequence & Materials", ur: "مرمت کی صحیح ترتیب اور سامان" })}
            </p>
            <ol className="mt-2.5 space-y-2.5">
              {diagnosis.repair_plan.map((step, i) => (
                <li key={i} className="rounded-2xl bg-leaf-soft/60 border border-[#bfe6d2] p-3.5 flex gap-3 items-start">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-ink text-white text-xs font-black grid place-items-center latin mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-extrabold text-ink">{step.step}</p>
                      <span className="rounded-full bg-white border border-line px-2.5 py-0.5 text-xs font-extrabold text-ink">
                        {step.trade} · ~{step.estimated_days} {t({ en: "day(s)", ur: "دن" })}
                      </span>
                    </div>
                    {step.materials?.length > 0 && (
                      <p className="text-xs font-bold text-ink-soft mt-1">
                        {t({ en: "Materials:", ur: "سامان:" })} {step.materials.join(", ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Safety Warnings */}
          <div className="rounded-2xl bg-danger-soft p-4 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-ink space-y-1">
              {diagnosis.safety_warnings?.length ? (
                diagnosis.safety_warnings.map((w, i) => <p key={i}>{w}</p>)
              ) : (
                <p>{t(SAFETY_NOTE)}</p>
              )}
            </div>
          </div>

          {/* Free-form follow-up question to Gemini */}
          <div className="pt-3 border-t border-line">
            <form onSubmit={handleAsk} className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                value={customQ}
                onChange={(e) => setCustomQ(e.target.value)}
                placeholder={t({
                  en: "Ask a follow-up question in English, Urdu, or Roman Urdu…",
                  ur: "اس معائنے کے بارے میں مزید کوئی سوال پوچھیں…",
                })}
                className="flex-1 min-w-0 h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 text-sm font-bold"
              />
              <button
                type="submit"
                disabled={asking || !customQ.trim()}
                className="h-11 px-4 rounded-xl bg-sky hover:bg-sky-dark disabled:opacity-50 text-white text-sm font-extrabold inline-flex items-center gap-1.5"
              >
                {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t({ en: "Ask AI", ur: "پوچھیں" })}
              </button>
            </form>
            {customAns && (
              <div className="mt-3 rounded-2xl bg-sun-soft p-3.5 text-sm space-y-1">
                <p className="font-bold text-ink">{isUrdu ? customAns.answer_ur : customAns.answer_en}</p>
                {!isUrdu && customAns.answer_ur && (
                  <p className="text-xs font-bold text-ink-soft" dir="rtl">
                    {customAns.answer_ur}
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-ink-soft font-semibold">
            {t({
              en: "Preliminary AI-assisted guidance based on visible evidence and your answers — not a certified structural or building inspection. Always have a qualified professional verify on site.",
              ur: "یہ اے آئی کی مدد سے ابتدائی تکنیکی رائے ہے، سرٹیفائیڈ بلڈنگ انسپکشن نہیں۔ کام شروع کرنے سے پہلے کاریگر سے موقع پر تصدیق کروائیں۔",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
