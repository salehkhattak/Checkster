"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, LayoutDashboard, MessageCircle, Printer, ShieldAlert, Star } from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { AREAS, PROBLEMS, SAFETY_NOTE, officialDayRange, tradeLabel, type Cause, type LineItem, type ProblemId, type WorkerOffer } from "@/lib/data";
import { lineTotal, type Finding } from "@/lib/audit";
import { resolveFileUrl, type AuditExplanation, type Diagnosis, type Estimate, type Inspection } from "@/lib/api";
import { DemoTag, Mascot } from "@/components/site/brand";
import { Card, CardTitle } from "./shell";
import { NeighbourhoodMap, TONE_COLOR } from "./map";

const BEFORE_YOU_PAY: Tx[] = [
  { en: "Ask to see where the water was coming from, and how it was fixed.", ur: "پوچھیں کہ پانی کہاں سے آ رہا تھا، اور اسے کیسے ٹھیک کیا گیا۔" },
  {
    en: "After a pipe repair, use the tap or shower for a day and check that no new damp appears.",
    ur: "پائپ کی مرمت کے بعد ایک دن نلکا یا شاور استعمال کریں اور دیکھیں کہ نئی سیلن تو نہیں آئی۔",
  },
  { en: "Don't paint until the wall is fully dry (1–2 weeks).", ur: "دیوار پوری طرح خشک ہونے تک رنگ نہ کروائیں (1 سے 2 ہفتے)۔" },
  { en: "Get a written bill with sizes and product names.", ur: "سائز اور پراڈکٹ کے ناموں کے ساتھ لکھا ہوا بل لیں۔" },
];

export function StepBooked({
  worker,
  price,
  cause,
  problem,
  inspectionId,
  city,
  neighbourhood,
  room,
  areaSqft,
  photos,
  inspection,
  answers,
  diagnosis,
  estimate,
  quoteItems,
  statedTotal,
  findings,
  contractorName,
  aiExplanation,
}: {
  worker: WorkerOffer | null;
  price: number;
  cause: Cause;
  problem: ProblemId;
  inspectionId?: string;
  city: string;
  neighbourhood: string;
  room: string;
  areaSqft: number;
  photos: string[];
  inspection: Inspection | null;
  answers: Record<string, string>;
  diagnosis: Diagnosis | null;
  estimate: Estimate | null;
  quoteItems: LineItem[];
  statedTotal: number | null;
  findings: Finding[] | null;
  contractorName: string;
  aiExplanation: AuditExplanation | null;
}) {
  const { t, money, isUrdu } = useLang();
  const tradeForRate = worker?.trade || diagnosis?.primary_trade || cause.trade;
  const [lo, hi] = officialDayRange(tradeForRate === "electrician" || tradeForRate === "carpenter" ? "mason" : tradeForRate);
  const problemTitle = t(PROBLEMS.find((p) => p.id === problem)!.title);

  const causeText = diagnosis
    ? isUrdu
      ? diagnosis.final_cause_ur || diagnosis.final_cause
      : diagnosis.final_cause
    : t(cause.title);

  const firstStepText = diagnosis?.repair_plan?.[0]?.step || t(cause.firstStep);
  const computedQuoteTotal = lineTotal(quoteItems);

  const reportLines = [
    `${t({ en: "CHECKSTER INSPECTION & QUOTE AUDIT REPORT", ur: "چیکسٹر معائنہ اور تخمینہ آڈٹ رپورٹ" })}`,
    `ID: ${inspectionId || "LOCAL-DRAFT"} · ${new Date().toLocaleDateString()}`,
    `${t({ en: "Location", ur: "مقام" })}: ${neighbourhood ? `${neighbourhood}, ` : ""}${city.toUpperCase()} (${room}, ~${areaSqft} sq ft)`,
    `${t({ en: "Problem", ur: "مسئلہ" })}: ${problemTitle}`,
    `${t({ en: "Diagnosis", ur: "تشخیص" })}: ${causeText}`,
    `${t({ en: "First Step", ur: "پہلا قدم" })}: ${firstStepText}`,
    estimate
      ? `${t({ en: "Estimated Cost Range", ur: "تخمینی لاگت" })}: ${money(estimate.total_low)} – ${money(estimate.total_high)}`
      : "",
    quoteItems.length > 0
      ? `${t({ en: "Quotation Audit", ur: "تخمینہ آڈٹ" })}: ${contractorName || "Contractor"} — Stated ${
          statedTotal ? money(statedTotal) : "N/A"
        }, Audited Sum ${money(computedQuoteTotal)} (${findings?.length || 0} findings)`
      : "",
    worker
      ? `${t({ en: "Selected Provider", ur: "منتخب کاریگر" })}: ${t(worker.name)} (${t(tradeLabel(worker.trade))}), ${money(price)}`
      : "",
    "",
    t({ en: "Note: Preliminary AI-assisted guidance, not a certified building inspection.", ur: "نوٹ: یہ ابتدائی تکنیکی رائے ہے، سرٹیفائیڈ بلڈنگ انسپکشن نہیں۔" }),
  ].filter(Boolean);
  const reportText = reportLines.join("\n");

  return (
    <div className="space-y-5">
      {worker && (
        <div className="rounded-3xl bg-leaf text-white p-6 flex items-center gap-4 pop-in no-print">
          <CheckCircle2 className="h-12 w-12 shrink-0" />
          <div>
            <p className="text-2xl sm:text-3xl font-black leading-tight ur-tight">
              {t({ en: `Request prepared for ${worker.name.en}`, ur: `${worker.name.ur} کے لیے درخواست تیار` })}
            </p>
            <p className="font-bold text-white/85">
              {t({ en: "Complete Inspection & Quote Audit Report saved below", ur: "مکمل معائنہ اور تخمینہ آڈٹ رپورٹ نیچے محفوظ ہے" })} ·{" "}
              <span className="latin">{money(price)}</span>
            </p>
          </div>
        </div>
      )}

      {worker && (
        <div className="no-print">
          <NeighbourhoodMap
            pins={[{ id: worker.id, x: worker.pin.x, y: worker.pin.y, label: worker.initials, color: TONE_COLOR[worker.tone] || "var(--leaf)" }]}
            routeTo={{ id: worker.id, x: worker.pin.x, y: worker.pin.y, label: worker.initials, color: TONE_COLOR[worker.tone] || "var(--leaf)" }}
            homeLabel={t({ en: "You", ur: "آپ" })}
            areaLabel={neighbourhood || t(AREAS[0].label)}
          />
        </div>
      )}

      {/* THE COMPLETE PERSISTENT INSPECTION & QUOTATION AUDIT REPORT */}
      <Card className="print:border-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <Mascot size={48} />
            <div>
              <h2 className="font-black text-2xl text-ink">
                {t({ en: "Checkster Inspection & Quote Audit Report", ur: "چیکسٹر معائنہ اور تخمینہ آڈٹ رپورٹ" })}
              </h2>
              <p className="text-xs text-ink-soft font-bold">
                {t({
                  en: "Independent second opinion before you pay · Preliminary AI-assisted guidance (not a certified building inspection)",
                  ur: "ادائیگی سے پہلے آزادانہ دوسری رائے · ابتدائی اے آئی رہنمائی (سرٹیفائیڈ بلڈنگ انسپکشن نہیں)",
                })}
              </p>
            </div>
          </div>
          <div className="text-end text-xs font-extrabold text-ink-soft latin">
            <p>ID: {inspectionId || "LOCAL-DRAFT"}</p>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Section 1: Inspection Summary & Photos */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase text-brand-dark">
            {t({ en: "1. Inspection Summary", ur: "1۔ معائنے کا خلاصہ" })}
          </h3>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Row k={t({ en: "Issue Category", ur: "مسئلے کی قسم" })} v={inspection?.issue_category || problemTitle} />
            <Row
              k={t({ en: "Property Area", ur: "جگہ اور شہر" })}
              v={`${room} (~${areaSqft} sq ft) · ${neighbourhood ? `${neighbourhood}, ` : ""}${city.toUpperCase()}`}
            />
            <Row
              k={t({ en: "Severity & Confidence", ur: "شدت اور اعتماد" })}
              v={`${(diagnosis?.severity || inspection?.severity || "moderate").toUpperCase()} · ${
                diagnosis ? `${Math.round(diagnosis.confidence * 100)}%` : t(cause.confidence)
              }`}
            />
          </dl>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={resolveFileUrl(src)}
                  alt={`Inspection photo ${i + 1}`}
                  className="aspect-[4/3] w-full rounded-2xl object-cover border border-ink"
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: AI Visual Inspection & Follow-up Answers */}
        <div className="space-y-3 pt-3 border-t border-line">
          <h3 className="text-sm font-black uppercase text-brand-dark">
            {t({ en: "2. AI Visual Evidence & Diagnosis", ur: "2۔ بصری شواہد اور تشخیص" })}
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Row k={t({ en: "Most Likely Cause", ur: "ممکنہ وجہ" })} v={causeText} wide />
            {diagnosis?.cause_explanation && (
              <Row k={t({ en: "Coordinator Explanation", ur: "وضاحت" })} v={diagnosis.cause_explanation} wide />
            )}
          </dl>

          {inspection?.observations && inspection.observations.length > 0 && (
            <div className="rounded-2xl bg-cream border border-line p-3.5 space-y-1.5">
              <p className="text-xs font-extrabold text-ink-soft uppercase">
                {t({ en: "Observed Visual Evidence", ur: "مشاہدہ کردہ شواہد" })}
              </p>
              <ul className="text-sm font-bold text-ink space-y-1">
                {inspection.observations.map((o, i) => (
                  <li key={i}>
                    • {o.observation} — <span className="font-semibold text-ink-soft">{o.evidence}</span> (
                    <span className="latin">{Math.round(o.confidence * 100)}%</span>)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(answers).length > 0 && (
            <div className="rounded-2xl bg-cream border border-line p-3.5">
              <p className="text-xs font-extrabold text-ink-soft uppercase">
                {t({ en: "Homeowner Follow-up Answers", ur: "سوالات کے جوابات" })}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(answers).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-white border border-line px-3 py-1 text-xs font-extrabold text-ink">
                    {k}: {v.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Recommended Repair Plan & Cost Estimate */}
        <div className="space-y-3 pt-3 border-t border-line">
          <h3 className="text-sm font-black uppercase text-brand-dark">
            {t({ en: "3. Repair Plan & Source-Backed Cost Estimate", ur: "3۔ مرمت کا منصوبہ اور تخمینی لاگت" })}
          </h3>
          {diagnosis?.repair_plan && diagnosis.repair_plan.length > 0 ? (
            <ol className="space-y-2">
              {diagnosis.repair_plan.map((s, idx) => (
                <li key={idx} className="rounded-2xl bg-cream border border-line p-3 flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-ink text-white text-xs font-black grid place-items-center shrink-0 latin">
                    {idx + 1}
                  </span>
                  <div className="text-sm">
                    <p className="font-extrabold text-ink">
                      {s.step} ({s.trade}, ~{s.estimated_days}d)
                    </p>
                    {s.materials?.length > 0 && (
                      <p className="text-xs font-semibold text-ink-soft">
                        {t({ en: "Materials:", ur: "سامان:" })} {s.materials.join(", ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Row k={t({ en: "Recommended First Step", ur: "پہلے یہ کریں" })} v={firstStepText} wide />
          )}

          <dl className="grid gap-3 sm:grid-cols-2">
            {estimate && (
              <Row
                k={t({ en: "Estimated Project Cost Range", ur: "تخمینی کل لاگت" })}
                v={
                  <span className="latin">
                    {money(estimate.total_low)} – {money(estimate.total_high)}
                  </span>
                }
              />
            )}
            <Row
              k={t({ en: "Official Labour Reference Rate", ur: "سرکاری یومیہ مزدوری ریٹ" })}
              v={
                <span className="latin">
                  {money(lo)} – {money(hi)} {t({ en: "per day (PBS / Finance Dept.)", ur: "فی دن" })}
                </span>
              }
            />
          </dl>
        </div>

        {/* Section 4: Quotation Audit (if quote uploaded/entered) */}
        {quoteItems.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-line">
            <h3 className="text-sm font-black uppercase text-brand-dark">
              {t({ en: "4. Contractor Quotation Audit", ur: "4۔ ٹھیکیدار کے تخمینے کا آڈٹ" })}
            </h3>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Row k={t({ en: "Contractor Name", ur: "ٹھیکیدار کا نام" })} v={contractorName || "Not specified"} />
              <Row
                k={t({ en: "Original Stated Total", ur: "تخمینے پر لکھی رقم" })}
                v={<span className="latin">{statedTotal ? money(statedTotal) : "Not stated"}</span>}
              />
              <Row
                k={t({ en: "Audited Line-Item Sum", ur: "آڈٹ شدہ جوڑ" })}
                v={<span className="latin">{money(computedQuoteTotal)}</span>}
              />
            </dl>
            {aiExplanation && (
              <p className="rounded-2xl bg-sun-soft p-3 text-sm font-bold text-ink">
                {isUrdu ? aiExplanation.summary_ur : aiExplanation.summary_en}
              </p>
            )}
            {findings && findings.length > 0 && (
              <div className="rounded-2xl bg-cream border border-line p-3.5 space-y-2">
                <p className="text-xs font-extrabold text-ink-soft uppercase">
                  {t({ en: "Audit Findings & Questions to Ask Contractor", ur: "آڈٹ کے نکات اور ٹھیکیدار سے پوچھنے کے سوالات" })}
                </p>
                <ul className="text-sm space-y-1.5">
                  {findings.map((f) => (
                    <li key={f.id} className="font-semibold text-ink">
                      • <strong>{t(f.title)}:</strong> {t(f.explain)} —{" "}
                      <span className="text-brand-dark font-extrabold">“{t(f.ask)}”</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Section 5: Selected Service Provider */}
        {worker && (
          <div className="space-y-3 pt-3 border-t border-line">
            <h3 className="text-sm font-black uppercase text-brand-dark">
              {t({ en: "5. Selected Service Provider", ur: "5۔ منتخب کاریگر" })}
            </h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Row
                k={t({ en: "Provider", ur: "کاریگر" })}
                v={
                  <span className="inline-flex items-center gap-1.5">
                    {t(worker.name)} · {t(tradeLabel(worker.trade))} · <Star className="h-3.5 w-3.5 fill-sun text-sun" />{" "}
                    <span className="latin">{worker.rating}</span>
                  </span>
                }
              />
              <Row k={t({ en: "Offered / Agreed Price", ur: "طے شدہ قیمت" })} v={<span className="latin">{money(price)}</span>} />
            </dl>
          </div>
        )}

        {/* Safety & Limitations Disclaimer */}
        <div className="rounded-2xl bg-danger-soft p-3.5 flex gap-2.5 items-start">
          <ShieldAlert className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div className="text-xs font-bold text-ink space-y-1">
            <p>{t(SAFETY_NOTE)}</p>
            <p className="text-ink-soft">
              {t({
                en: "Disclaimer: This report is a preliminary AI-assisted assessment and deterministic quote check. It is not a certified structural or building engineering inspection.",
                ur: "وضاحت: یہ رپورٹ ابتدائی اے آئی رہنمائی اور حسابی تخمینہ چیک ہے۔ یہ سرٹیفائیڈ بلڈنگ انسپکشن نہیں۔",
              })}
            </p>
          </div>
        </div>

        {/* Actions: Print/PDF, WhatsApp, Dashboard */}
        <div className="grid gap-2 sm:grid-cols-3 no-print pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-14 rounded-2xl border-2 border-ink bg-white font-extrabold text-ink inline-flex items-center justify-center gap-2 hover:bg-sun-soft"
          >
            <Printer className="h-5 w-5" /> {t({ en: "Print / Save PDF", ur: "پرنٹ یا PDF محفوظ کریں" })}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(reportText)}`}
            target="_blank"
            rel="noreferrer"
            className="h-14 rounded-2xl bg-[#1fa855] text-white font-extrabold inline-flex items-center justify-center gap-2 hover:brightness-95"
          >
            <MessageCircle className="h-5 w-5" /> {t({ en: "Share on WhatsApp", ur: "واٹس ایپ پر شیئر کریں" })}
          </a>
          <Link
            href="/dashboard"
            className="h-14 rounded-2xl bg-ink text-white font-extrabold inline-flex items-center justify-center gap-2 hover:bg-black"
          >
            <LayoutDashboard className="h-5 w-5" /> {t({ en: "My Saved Reports", ur: "محفوظ رپورٹس" })}
          </Link>
        </div>
      </Card>

      <Card className="no-print">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-brand" /> {t({ en: "Before you pay the contractor", ur: "ادائیگی سے پہلے" })}
          </span>
        </CardTitle>
        <ol className="space-y-3">
          {BEFORE_YOU_PAY.map((b, i) => (
            <li key={b.en} className="flex gap-3 items-start">
              <span className="h-7 w-7 shrink-0 rounded-full bg-sun border-2 border-ink text-sm font-black grid place-items-center latin">
                {i + 1}
              </span>
              <span className="font-bold text-ink pt-0.5">{t(b)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Row({ k, v, wide = false }: { k: string; v: ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-2xl bg-cream border border-line p-3 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-extrabold text-ink-soft">{k}</dt>
      <dd className="font-bold text-ink mt-0.5">{v}</dd>
    </div>
  );
}
