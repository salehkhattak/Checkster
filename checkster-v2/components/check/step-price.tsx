"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Copy,
  ExternalLink,
  FileText,
  FileUp,
  Info,
  Loader2,
  MessageCircle,
  Plus,
  Ruler,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SAMPLE_QUOTE, SAMPLE_QUOTE_TOTAL, SOURCES, fairEstimate, type Cause, type LineItem } from "@/lib/data";
import { auditQuote, lineTotal, type Finding } from "@/lib/audit";
import {
  api,
  type ApiFinding,
  type AuditExplanation,
  type Diagnosis,
  type Estimate,
  type ExtractedQuote,
} from "@/lib/api";
import { DemoTag, OfficialTag } from "@/components/site/brand";
import { IllPrice } from "@/components/site/illustrations";
import { Card, CardTitle } from "./shell";

export type QuoteMode = "none" | "have" | null;

export function StepPrice(props: {
  cause: Cause;
  diagnosis: Diagnosis | null;
  estimate: Estimate | null;
  inspectionId?: string;
  city: string;
  area: number;
  mode: QuoteMode;
  setMode: (m: QuoteMode) => void;
  items: LineItem[];
  setItems: (i: LineItem[]) => void;
  statedTotal: number | null;
  setStatedTotal: (n: number | null) => void;
  findings: Finding[] | null;
  setFindings: (f: Finding[] | null) => void;
  contractorName: string;
  setContractorName: (s: string) => void;
  aiExplanation: AuditExplanation | null;
  setAiExplanation: (e: AuditExplanation | null) => void;
}) {
  const { t } = useLang();
  const { mode, setMode } = props;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice
          on={mode === "none"}
          onClick={() => setMode("none")}
          title={t({ en: "I don't have a price yet", ur: "میرے پاس ابھی کوئی قیمت نہیں" })}
          line={t({ en: "Show me a fair price from official & local rates", ur: "سرکاری اور مقامی ریٹ سے مناسب قیمت دکھائیں" })}
          art={<IllPrice size={64} bg="#fff" />}
        />
        <Choice
          on={mode === "have"}
          onClick={() => setMode("have")}
          title={t({ en: "I have a contractor's quote", ur: "میرے پاس ٹھیکیدار کا تخمینہ ہے" })}
          line={t({ en: "Upload PDF/photo (OCR) or enter lines to audit", ur: "تخمینے کی تصویر/PDF اپ لوڈ کریں یا ہر لائن چیک کریں" })}
          art={
            <span className="h-16 w-16 rounded-full bg-white grid place-items-center border-2 border-ink">
              <FileUp className="h-7 w-7 text-ink" />
            </span>
          }
        />
      </div>

      {mode === "none" && (
        <FairPrice cause={props.cause} area={props.area} estimate={props.estimate} city={props.city} />
      )}
      {mode === "have" && <QuoteCheck {...props} />}
    </div>
  );
}

function Choice({
  on,
  onClick,
  title,
  line,
  art,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  line: string;
  art: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`text-start rounded-3xl border-2 p-4 flex items-center gap-4 transition-colors ${
        on ? "border-ink bg-sun-soft shadow-[0_4px_0_0_var(--ink)]" : "border-line bg-white hover:border-ink"
      }`}
    >
      <span className="shrink-0">{art}</span>
      <span>
        <span className="block text-lg font-black text-ink leading-tight ur-tight">{title}</span>
        <span className="block mt-1 text-ink-soft font-semibold leading-snug">{line}</span>
      </span>
      <span
        className={`ms-auto h-7 w-7 shrink-0 rounded-full border-2 grid place-items-center ${
          on ? "bg-ink border-ink text-white" : "border-line"
        }`}
      >
        {on && <Check className="h-4 w-4" />}
      </span>
    </button>
  );
}

function SourceBadge({ type }: { type: "official" | "market_observed" | "sample" }) {
  const { t } = useLang();
  if (type === "official") return <OfficialTag />;
  if (type === "market_observed") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-soft text-sky-dark text-[11px] font-extrabold px-2 py-0.5">
        {t({ en: "Market-observed rate", ur: "مارکیٹ ریٹ" })}
      </span>
    );
  }
  return <DemoTag />;
}

// ---------------- No quote yet: fair price ----------------
function FairPrice({
  cause,
  area,
  estimate,
  city,
}: {
  cause: Cause;
  area: number;
  estimate: Estimate | null;
  city: string;
}) {
  const { t, money } = useLang();
  const fallbackRows = fairEstimate(cause, area);
  const rows = estimate?.rows?.length
    ? estimate.rows.map((r, i) => ({
        id: `est-${i}`,
        workLabel: r.work,
        low: r.low,
        high: r.high,
        sourceType: r.source_type,
        kind: r.kind,
      }))
    : fallbackRows.map((r) => ({
        id: r.id,
        workLabel: t(r.work),
        low: r.low,
        high: r.high,
        sourceType: (r.source === "sample" ? "sample" : "official") as "official" | "sample",
        kind: r.source === "sample" ? "material" : "labour",
      }));

  const low = estimate ? estimate.total_low : rows.reduce((s, r) => s + r.low, 0);
  const high = estimate ? estimate.total_high : rows.reduce((s, r) => s + r.high, 0);

  return (
    <Card className="rise-in">
      <CardTitle
        sub={t({
          en: `Location-aware estimate for ${city.toUpperCase()} (~${area} sq ft). Clearly separates official labour rates, market-observed charges, and sample material estimates.`,
          ur: `${city.toUpperCase()} کے لیے تخمینی لاگت۔ سرکاری مزدوری ریٹ، مارکیٹ ریٹ اور نمونہ سامان کی قیمتیں الگ دکھائی گئی ہیں۔`,
        })}
      >
        {t({ en: "Estimated Project Repair Cost", ur: "اس مرمت کا تخمینی خرچ" })}
      </CardTitle>

      <div className="rounded-2xl bg-ink text-white p-5 text-center">
        <p className="text-sm font-bold text-white/70">
          {t({ en: "Estimated project total (labour + materials + testing)", ur: "مناسب کل رقم (مزدوری + سامان + ٹیسٹ)" })}
        </p>
        <p className="text-3xl sm:text-4xl font-black mt-1 latin">
          {money(low)} – {money(high)}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="py-3 flex items-start gap-3">
            <div className="flex-1">
              <p className="font-bold text-ink">{r.workLabel}</p>
              <div className="mt-1 flex items-center gap-2">
                <SourceBadge type={r.sourceType} />
                <span className="text-[11px] font-bold text-ink-soft uppercase">{r.kind}</span>
              </div>
            </div>
            <p className="font-black text-ink text-end whitespace-nowrap latin">
              {money(r.low)}
              <span className="text-ink-soft font-bold"> – </span>
              {money(r.high)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl bg-cream border border-line p-4 text-sm space-y-2">
        <p className="font-extrabold text-ink flex items-center gap-1.5">
          <Info className="h-4 w-4" />
          {t({ en: "Where these numbers come from", ur: "یہ نمبر کہاں سے آئے" })}
        </p>
        <ul className="space-y-1.5 text-ink-soft text-xs font-semibold">
          {(["pbs", "punjab"] as const).map((k) => (
            <li key={k}>
              <a
                href={SOURCES[k].url}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ink inline-flex items-center gap-1 font-bold"
              >
                {t(SOURCES[k].name)} · {t(SOURCES[k].date)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
          {estimate?.notes?.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

// ---------------- Have a quote: OCR + Deterministic Audit + AI Explanation ----------------
function QuoteCheck({
  items,
  setItems,
  statedTotal,
  setStatedTotal,
  findings,
  setFindings,
  diagnosis,
  estimate,
  inspectionId,
  city,
  contractorName,
  setContractorName,
  aiExplanation,
  setAiExplanation,
}: {
  items: LineItem[];
  setItems: (i: LineItem[]) => void;
  statedTotal: number | null;
  setStatedTotal: (n: number | null) => void;
  findings: Finding[] | null;
  setFindings: (f: Finding[] | null) => void;
  diagnosis: Diagnosis | null;
  estimate: Estimate | null;
  inspectionId?: string;
  city: string;
  contractorName: string;
  setContractorName: (s: string) => void;
  aiExplanation: AuditExplanation | null;
  setAiExplanation: (e: AuditExplanation | null) => void;
}) {
  const { t, money, isUrdu } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrMeta, setOcrMeta] = useState<ExtractedQuote | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [empty, setEmpty] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleUploadQuote = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setOcrError("");
    setOcrLoading(true);
    setFindings(null);
    setAiExplanation(null);
    try {
      const extracted = await api.extractQuote(file, inspectionId);
      setOcrMeta(extracted);
      if (extracted.contractor_name) setContractorName(extracted.contractor_name);
      if (extracted.stated_total !== null && extracted.stated_total !== undefined) {
        setStatedTotal(extracted.stated_total);
      }
      const mapped: LineItem[] = (extracted.line_items || []).map((li, idx) => ({
        id: `ocr_${idx}_${Date.now()}`,
        work: li.description || "",
        quantity: li.quantity ?? null,
        unit: li.unit || "",
        amount: li.total_price ?? 0,
      }));
      setItems(mapped);
    } catch (err) {
      setOcrError((err as Error).message || "Could not extract text from the quotation document.");
    } finally {
      setOcrLoading(false);
    }
  };

  const update = (id: string, patch: Partial<LineItem>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setFindings(null);
    setAiExplanation(null);
  };
  const remove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    setFindings(null);
    setAiExplanation(null);
  };
  const add = () => {
    setItems([...items, { id: `n${Date.now()}`, work: "", quantity: null, unit: "", amount: 0 }]);
    setFindings(null);
  };
  const useSample = () => {
    setItems(SAMPLE_QUOTE.map((i) => ({ ...i })));
    setStatedTotal(SAMPLE_QUOTE_TOTAL);
    setContractorName("Sample Contractor Quote (Demo)");
    setOcrMeta(null);
    setFindings(null);
    setAiExplanation(null);
  };

  const run = async () => {
    if (!items.some((i) => i.work.trim() && i.amount > 0)) {
      setEmpty(true);
      setFindings(null);
      return;
    }
    setEmpty(false);
    setAuditing(true);
    setAiExplanation(null);

    const payloadItems = items
      .filter((i) => i.work.trim())
      .map((i) => ({
        description: i.work,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.quantity && i.quantity > 0 ? Math.round(i.amount / i.quantity) : null,
        total_price: i.amount,
        category: (i.work.toLowerCase().includes("labour") ? "labour" : "other") as
          | "labour"
          | "material"
          | "equipment"
          | "transport"
          | "other",
      }));

    try {
      const res = await api.audit(
        payloadItems,
        statedTotal,
        diagnosis,
        estimate?.total_low ?? null,
        city,
        ocrMeta?.quotation_id,
        inspectionId,
        contractorName,
      );
      const mappedFindings: Finding[] = res.findings.map((f: ApiFinding) => ({
        id: f.id,
        severity: f.severity,
        title: f.title,
        item: f.item,
        explain: f.explain,
        ask: f.ask,
      }));
      setFindings(mappedFindings);
      setAuditing(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

      // Now call Gemini to explain the deterministic findings
      if (res.findings.length > 0) {
        setExplaining(true);
        try {
          const exp = await api.explain(res.findings, payloadItems, diagnosis, res.quotation_id);
          setAiExplanation(exp);
        } catch {
          /* deterministic audit already succeeded */
        } finally {
          setExplaining(false);
        }
      }
    } catch {
      // Fallback to local deterministic rules if backend is unreachable
      setFindings(auditQuote(items, statedTotal));
      setAuditing(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const questions = (findings ?? []).map((f, i) => `${i + 1}. ${t(f.ask)}`).join("\n");
  const waText = `${t({
    en: "Assalam o Alaikum. Before we agree on the quote, I have a few questions:",
    ur: "السلام علیکم۔ تخمینہ طے کرنے سے پہلے میرے چند سوال ہیں:",
  })}\n\n${questions}\n\n${t({ en: "Thank you!", ur: "شکریہ!" })}`;
  const serious = (findings ?? []).filter((f) => f.severity !== "info").length;

  return (
    <div className="space-y-5 rise-in">
      <Card>
        <CardTitle
          sub={t({
            en: "Upload a PDF or photo of the contractor's quote for automatic OCR extraction, or edit/add lines manually.",
            ur: "خودکار پڑھنے (OCR) کے لیے ٹھیکیدار کے تخمینے کی تصویر یا PDF اپ لوڈ کریں، یا نیچے لائنیں لکھیں۔",
          })}
        >
          {t({ en: "The contractor's quotation", ur: "ٹھیکیدار کا تخمینہ" })}
        </CardTitle>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={ocrLoading}
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-ink bg-cream/60 hover:bg-sun-soft p-4 flex items-center gap-3 font-extrabold text-ink"
          >
            {ocrLoading ? <Loader2 className="h-6 w-6 animate-spin text-brand" /> : <FileUp className="h-6 w-6 text-brand" />}
            <span className="truncate">
              {ocrLoading
                ? t({ en: "Extracting quote lines with OCR…", ur: "تخمینہ پڑھا جا رہا ہے…" })
                : fileName || t({ en: "Upload photo or PDF of quote (OCR)", ur: "تخمینے کی تصویر یا PDF اپ لوڈ کریں" })}
            </span>
          </button>
          <button
            type="button"
            onClick={useSample}
            className="rounded-2xl bg-sun-soft hover:bg-sun p-4 font-extrabold text-ink flex items-center gap-2 justify-center"
          >
            {t({ en: "Use sample quote", ur: "نمونہ تخمینہ لگائیں" })}{" "}
            <span className="latin">({money(SAMPLE_QUOTE_TOTAL)})</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleUploadQuote(e.target.files?.[0])}
        />

        {ocrError && (
          <div className="mt-3 rounded-2xl bg-danger-soft border border-danger p-3 text-sm font-bold text-danger">
            {ocrError}
          </div>
        )}

        {/* OCR Review Banner */}
        {ocrMeta && (
          <div className="mt-4 rounded-2xl bg-sky-soft/60 border-2 border-sky p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-ink text-sm flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-sky-dark" />
                {t({
                  en: "OCR Extraction Complete — Please verify the extracted lines below before auditing",
                  ur: "تخمینہ پڑھ لیا گیا ہے — آڈٹ سے پہلے نیچے دی گئی لائنوں کی تصدیق کر لیں",
                })}
              </p>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-ink latin">
                {Math.round(ocrMeta.extraction_confidence * 100)}% OCR conf · {ocrMeta.language_detected.toUpperCase()}
              </span>
            </div>
            {ocrMeta.needs_user_review && (
              <p className="text-xs font-bold text-[#8a5a00] bg-amber-soft rounded-xl px-3 py-1.5">
                {t({
                  en: "Some handwritten or faint values need your confirmation. Missing quantities or prices are never invented.",
                  ur: "کچھ الفاظ مدہم تھے۔ براہ کرم مقدار اور قیمت چیک کر لیں۔",
                })}
              </p>
            )}
            {ocrMeta.review_notes?.length > 0 && (
              <ul className="text-xs font-semibold text-ink-soft list-disc ps-4">
                {ocrMeta.review_notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Contractor Name */}
        <div className="mt-4">
          <label className="block text-xs font-extrabold text-ink-soft uppercase" htmlFor="contractor-name">
            {t({ en: "Contractor / Business Name (optional)", ur: "ٹھیکیدار یا دکان کا نام (اختیاری)" })}
          </label>
          <input
            id="contractor-name"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            placeholder={t({ en: "e.g. Khyber Waterproofing & Construction", ur: "مثلاً خیبر کنسٹرکشن" })}
            className="mt-1 w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold bg-cream/40"
          />
        </div>

        {/* Editable Line Items */}
        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <p className="text-center text-ink-soft font-bold py-4">
              {t({
                en: "No lines yet. Upload a quote document above, add a line, or use the sample quote.",
                ur: "ابھی کوئی لائن نہیں۔ اوپر تخمینہ اپ لوڈ کریں، لائن شامل کریں، یا نمونہ لگائیں۔",
              })}
            </p>
          )}
          {items.map((i) => (
            <LineRow key={i.id} item={i} onChange={(p) => update(i.id, p)} onRemove={() => remove(i.id)} />
          ))}
          <button
            type="button"
            onClick={add}
            className="w-full rounded-2xl border-2 border-dashed border-line hover:border-ink py-3 font-extrabold text-ink inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" /> {t({ en: "Add a line item", ur: "لائن شامل کریں" })}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-cream border border-line p-4">
          <label className="font-extrabold text-ink" htmlFor="quote-total">
            {t({ en: "Grand total written on the quote", ur: "تخمینے پر لکھی کل رقم" })}
          </label>
          <input
            id="quote-total"
            inputMode="numeric"
            value={statedTotal ?? ""}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setStatedTotal(v ? Number(v) : null);
              setFindings(null);
            }}
            className="ms-auto w-36 rounded-xl border-2 border-line focus:border-ink outline-none px-3 py-2 text-lg font-black text-end latin"
            placeholder="0"
          />
          <p className="w-full text-sm text-ink-soft">
            {t({ en: "Deterministic Python sum of line items:", ur: "لائنوں کا اصل حسابی جوڑ:" })}{" "}
            <strong className="latin">{money(lineTotal(items))}</strong>
          </p>
        </div>

        <button
          type="button"
          disabled={auditing}
          onClick={run}
          className="mt-5 w-full h-14 rounded-2xl bg-ink hover:bg-black disabled:opacity-50 text-white text-lg font-black inline-flex items-center justify-center gap-2"
        >
          {auditing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}{" "}
          {t({ en: "Run Deterministic Quote Audit", ur: "یہ تخمینہ چیک کریں" })}
        </button>
        {empty && (
          <p className="mt-3 text-center font-bold text-danger">
            {t({
              en: "Add at least one line with an amount, or use the sample quote.",
              ur: "کم از کم ایک لائن رقم کے ساتھ لکھیں، یا نمونہ تخمینہ لگائیں۔",
            })}
          </p>
        )}
      </Card>

      {findings && (
        <div ref={resultsRef} className="space-y-3 scroll-mt-24">
          <Card className={serious > 0 ? "border-amber" : "border-leaf"}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-2xl font-black text-ink ur-tight">
                {serious > 0
                  ? t({
                      en: `Ask before you agree: ${serious} things need clarifying`,
                      ur: `ہاں کرنے سے پہلے پوچھیں: ${serious} باتیں واضح کرنی ہیں`,
                    })
                  : t({ en: "This quote looks arithmetically complete", ur: "یہ تخمینہ مکمل لگتا ہے" })}
              </p>
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-ink">
                {t({ en: "Python Deterministic Math", ur: "پائتھون حسابی آڈٹ" })}
              </span>
            </div>
            <p className="mt-2 text-ink-soft font-semibold">
              {t({
                en: "All arithmetic and reference-rate comparisons were calculated deterministically by code (never guessed by AI). Use these polite questions to clarify scope with your contractor.",
                ur: "تمام حساب کتاب کوڈ کے ذریعے کیا گیا ہے۔ یہ شائستہ سوال پورے کام پر اتفاق میں مدد دیتے ہیں۔",
              })}
            </p>

            {/* AI Explanation of deterministic findings */}
            {explaining && (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-sky-dark">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t({ en: "Gemini is generating bilingual summary & Roman Urdu explanation…", ur: "جیمنائی اردو اور رومن اردو خلاصہ تیار کر رہا ہے…" })}
              </div>
            )}
            {aiExplanation && (
              <div className="mt-4 rounded-2xl bg-sun-soft/80 border border-ink p-4 space-y-2">
                <p className="text-xs font-black uppercase text-ink flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-brand" />
                  {t({ en: "Gemini Audit Summary (English / Urdu / Roman Urdu)", ur: "جیمنائی آڈٹ خلاصہ" })}
                </p>
                <p className="text-sm font-bold text-ink">
                  {isUrdu ? aiExplanation.summary_ur : aiExplanation.summary_en}
                </p>
                {aiExplanation.summary_roman_ur && (
                  <p className="text-xs font-bold text-ink-soft italic">
                    Roman Urdu: {aiExplanation.summary_roman_ur}
                  </p>
                )}
              </div>
            )}
          </Card>

          {findings.map((f) => (
            <FindingCard key={f.id} f={f} />
          ))}

          {findings.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(waText)
                    .then(() => setCopied(true))
                    .catch(() => setCopied(false));
                }}
                className="h-14 rounded-2xl border-2 border-ink bg-white font-extrabold text-ink inline-flex items-center justify-center gap-2 hover:bg-sun-soft"
              >
                <Copy className="h-5 w-5" />{" "}
                {copied
                  ? t({ en: "Copied!", ur: "کاپی ہو گیا!" })
                  : t({ en: "Copy all questions", ur: "تمام سوال کاپی کریں" })}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                className="h-14 rounded-2xl bg-[#1fa855] text-white font-extrabold inline-flex items-center justify-center gap-2 hover:brightness-95"
              >
                <MessageCircle className="h-5 w-5" />{" "}
                {t({ en: "Send to contractor on WhatsApp", ur: "ٹھیکیدار کو واٹس ایپ کریں" })}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LineRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem;
  onChange: (p: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  const { t } = useLang();
  const [showSize, setShowSize] = useState(item.quantity !== null);
  return (
    <div className="rounded-2xl border-2 border-line p-3">
      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
        <input
          value={item.work}
          onChange={(e) => onChange({ work: e.target.value })}
          placeholder={t({ en: "Work, e.g. Wall scraping", ur: "کام، مثلاً دیوار کی کھرچائی" })}
          className="basis-full sm:basis-auto flex-1 min-w-0 rounded-xl bg-cream/60 border border-line focus:border-ink outline-none px-3 py-2 font-bold"
        />
        <input
          inputMode="numeric"
          value={item.amount || ""}
          onChange={(e) => onChange({ amount: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
          placeholder="Rs"
          aria-label={t({ en: "Amount in rupees", ur: "رقم روپے میں" })}
          className="flex-1 sm:flex-none sm:w-28 rounded-xl bg-cream/60 border border-line focus:border-ink outline-none px-3 py-2 font-black text-end latin"
        />
        <button
          type="button"
          onClick={onRemove}
          className="h-10 w-10 shrink-0 rounded-xl grid place-items-center text-ink-soft hover:text-danger hover:bg-danger-soft"
          aria-label={t({ en: "Remove line", ur: "لائن ہٹائیں" })}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      {showSize ? (
        <div className="mt-2 flex gap-2 items-center">
          <Ruler className="h-4 w-4 text-ink-soft" />
          <input
            inputMode="numeric"
            value={item.quantity ?? ""}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              onChange({ quantity: v ? Number(v) : null });
            }}
            placeholder={t({ en: "Qty", ur: "مقدار" })}
            className="w-24 rounded-xl bg-cream/60 border border-line focus:border-ink outline-none px-3 py-1.5 font-bold latin"
          />
          <input
            value={item.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder={t({ en: "sq ft / litre / day", ur: "مربع فٹ / لیٹر / دن" })}
            className="w-36 rounded-xl bg-cream/60 border border-line focus:border-ink outline-none px-3 py-1.5 font-bold"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSize(true)}
          className="mt-2 text-sm font-bold text-sky-dark inline-flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> {t({ en: "Add quantity & unit (sq ft, litres, days…)", ur: "سائز لکھیں (مربع فٹ، لیٹر…)" })}
        </button>
      )}
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const { t } = useLang();
  const style =
    f.severity === "high"
      ? { border: "border-danger", badge: "bg-danger-soft text-danger", label: t({ en: "Important", ur: "اہم" }), Icon: AlertTriangle }
      : f.severity === "medium"
        ? {
            border: "border-amber",
            badge: "bg-amber-soft text-[#8a5a00]",
            label: t({ en: "Ask about this", ur: "اس بارے میں پوچھیں" }),
            Icon: CircleHelp,
          }
        : { border: "border-sky", badge: "bg-sky-soft text-sky-dark", label: t({ en: "Good to know", ur: "جاننا مفید ہے" }), Icon: Info };
  return (
    <div className={`rounded-3xl bg-white border-2 ${style.border} p-5 rise-in`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${style.badge}`}>
          <style.Icon className="h-3.5 w-3.5" /> {style.label}
        </span>
        <span className="text-xs font-bold text-ink-soft truncate">{f.item}</span>
      </div>
      <h3 className="mt-2 text-lg font-black text-ink ur-tight">{t(f.title)}</h3>
      <p className="mt-1 text-ink-soft font-semibold leading-relaxed">{t(f.explain)}</p>
      <div className="mt-3 rounded-2xl bg-sun-soft p-3">
        <p className="text-xs font-extrabold text-ink-soft">{t({ en: "Ask your contractor", ur: "ٹھیکیدار سے پوچھیں" })}</p>
        <p className="font-black text-ink">“{t(f.ask)}”</p>
      </div>
    </div>
  );
}
