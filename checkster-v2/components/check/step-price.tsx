"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Check, CircleHelp, Copy, ExternalLink, FileUp, Info, MessageCircle, Plus, Ruler, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SAMPLE_QUOTE, SAMPLE_QUOTE_TOTAL, SOURCES, fairEstimate, type Cause, type LineItem } from "@/lib/data";
import { auditQuote, lineTotal, type Finding } from "@/lib/audit";
import { DemoTag, OfficialTag } from "@/components/site/brand";
import { IllPrice } from "@/components/site/illustrations";
import { Card, CardTitle } from "./shell";

export type QuoteMode = "none" | "have" | null;

export function StepPrice(props: {
  cause: Cause;
  area: number;
  mode: QuoteMode;
  setMode: (m: QuoteMode) => void;
  items: LineItem[];
  setItems: (i: LineItem[]) => void;
  statedTotal: number | null;
  setStatedTotal: (n: number | null) => void;
  findings: Finding[] | null;
  setFindings: (f: Finding[] | null) => void;
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
          line={t({ en: "Show me a fair price from official rates", ur: "سرکاری ریٹ سے مناسب قیمت دکھائیں" })}
          art={<IllPrice size={64} bg="#fff" />}
        />
        <Choice
          on={mode === "have"}
          onClick={() => setMode("have")}
          title={t({ en: "I have a contractor's quote", ur: "میرے پاس ٹھیکیدار کا تخمینہ ہے" })}
          line={t({ en: "Check it line by line before I agree", ur: "ہاں کرنے سے پہلے ہر لائن چیک کریں" })}
          art={
            <span className="h-16 w-16 rounded-full bg-white grid place-items-center border-2 border-ink">
              <FileUp className="h-7 w-7 text-ink" />
            </span>
          }
        />
      </div>

      {mode === "none" && <FairPrice cause={props.cause} area={props.area} />}
      {mode === "have" && <QuoteCheck {...props} />}
    </div>
  );
}

function Choice({ on, onClick, title, line, art }: { on: boolean; onClick: () => void; title: string; line: string; art: ReactNode }) {
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
      <span className={`ms-auto h-7 w-7 shrink-0 rounded-full border-2 grid place-items-center ${on ? "bg-ink border-ink text-white" : "border-line"}`}>
        {on && <Check className="h-4 w-4" />}
      </span>
    </button>
  );
}

// ---------------- No quote yet: fair price ----------------
function FairPrice({ cause, area }: { cause: Cause; area: number }) {
  const { t, money } = useLang();
  const rows = fairEstimate(cause, area);
  const low = rows.reduce((s, r) => s + r.low, 0);
  const high = rows.reduce((s, r) => s + r.high, 0);
  return (
    <Card className="rise-in">
      <CardTitle sub={t({ en: "Labour from official government rates. Materials are sample prices for now.", ur: "مزدوری سرکاری ریٹ سے۔ سامان کی قیمتیں فی الحال نمونہ ہیں۔" })}>
        {t({ en: "A fair price for this repair", ur: "اس مرمت کی مناسب قیمت" })}
      </CardTitle>

      <div className="rounded-2xl bg-ink text-white p-5 text-center">
        <p className="text-sm font-bold text-white/70">{t({ en: "Fair total, about", ur: "مناسب کل رقم، تقریباً" })}</p>
        <p className="text-3xl sm:text-4xl font-black mt-1 latin">
          {money(low)} – {money(high)}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="py-3 flex items-start gap-3">
            <div className="flex-1">
              <p className="font-bold text-ink">{t(r.work)}</p>
              <div className="mt-1">{r.source === "sample" ? <DemoTag /> : <OfficialTag />}</div>
            </div>
            <p className="font-black text-ink text-end whitespace-nowrap latin">
              {money(r.low)}
              <span className="text-ink-soft font-bold"> – </span>
              {money(r.high)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl bg-cream border border-line p-4 text-sm">
        <p className="font-extrabold text-ink flex items-center gap-1.5">
          <Info className="h-4 w-4" />
          {t({ en: "Where these numbers come from", ur: "یہ نمبر کہاں سے آئے" })}
        </p>
        <ul className="mt-2 space-y-1.5 text-ink-soft">
          {(["pbs", "punjab"] as const).map((k) => (
            <li key={k}>
              <a href={SOURCES[k].url} target="_blank" rel="noreferrer" className="underline hover:text-ink inline-flex items-center gap-1">
                {t(SOURCES[k].name)} · {t(SOURCES[k].date)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
          <li>{t({ en: "Low end = PBS national average day rate. High end = Punjab govt. skilled worker rate (Rs 2,000/day).", ur: "کم سے کم = ادارہ شماریات کی قومی اوسط۔ زیادہ سے زیادہ = پنجاب حکومت کا ہنر مند کاریگر ریٹ (2,000 روپے فی دن)۔" })}</li>
        </ul>
      </div>
    </Card>
  );
}

// ---------------- Have a quote: check it ----------------
function QuoteCheck({
  items,
  setItems,
  statedTotal,
  setStatedTotal,
  findings,
  setFindings,
}: {
  items: LineItem[];
  setItems: (i: LineItem[]) => void;
  statedTotal: number | null;
  setStatedTotal: (n: number | null) => void;
  findings: Finding[] | null;
  setFindings: (f: Finding[] | null) => void;
}) {
  const { t, money } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);
  const [empty, setEmpty] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const update = (id: string, patch: Partial<LineItem>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setFindings(null);
  };
  const remove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    setFindings(null);
  };
  const add = () => {
    setItems([...items, { id: `n${Date.now()}`, work: "", quantity: null, unit: "", amount: 0 }]);
    setFindings(null);
  };
  const useSample = () => {
    setItems(SAMPLE_QUOTE.map((i) => ({ ...i })));
    setStatedTotal(SAMPLE_QUOTE_TOTAL);
    setFindings(null);
  };
  const run = () => {
    if (!items.some((i) => i.work.trim() && i.amount > 0)) {
      setEmpty(true);
      setFindings(null);
      return;
    }
    setEmpty(false);
    setFindings(auditQuote(items, statedTotal));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const questions = (findings ?? []).map((f, i) => `${i + 1}. ${t(f.ask)}`).join("\n");
  const waText = `${t({ en: "Assalam o Alaikum. Before we agree on the quote, I have a few questions:", ur: "السلام علیکم۔ تخمینہ طے کرنے سے پہلے میرے چند سوال ہیں:" })}\n\n${questions}\n\n${t({ en: "Thank you!", ur: "شکریہ!" })}`;
  const serious = (findings ?? []).filter((f) => f.severity !== "info").length;

  return (
    <div className="space-y-5 rise-in">
      <Card>
        <CardTitle sub={t({ en: "Type the lines from the quote, or try our sample quote.", ur: "تخمینے کی لائنیں لکھیں، یا ہمارا نمونہ تخمینہ آزمائیں۔" })}>
          {t({ en: "The contractor's quote", ur: "ٹھیکیدار کا تخمینہ" })}
        </CardTitle>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-line hover:border-ink p-4 flex items-center gap-3 font-bold text-ink"
          >
            <FileUp className="h-6 w-6" />
            {fileName || t({ en: "Upload photo or PDF of quote", ur: "تخمینے کی تصویر یا PDF لگائیں" })}
          </button>
          <button type="button" onClick={useSample} className="rounded-2xl bg-sun-soft hover:bg-sun p-4 font-extrabold text-ink flex items-center gap-2 justify-center">
            {t({ en: "Use sample quote", ur: "نمونہ تخمینہ لگائیں" })} <span className="latin">({money(SAMPLE_QUOTE_TOTAL)})</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
        {fileName && (
          <p className="mt-2 text-sm font-bold text-amber">
            {t({
              en: "Got it. Reading quotes automatically is coming in the next version. For now, please type the lines below.",
              ur: "مل گیا۔ تخمینہ خود بخود پڑھنا اگلے ورژن میں آ رہا ہے۔ ابھی نیچے لائنیں لکھ دیں۔",
            })}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {items.length === 0 && (
            <p className="text-center text-ink-soft font-bold py-4">{t({ en: "No lines yet. Add one, or use the sample.", ur: "ابھی کوئی لائن نہیں۔ لائن شامل کریں، یا نمونہ لگائیں۔" })}</p>
          )}
          {items.map((i) => (
            <LineRow key={i.id} item={i} onChange={(p) => update(i.id, p)} onRemove={() => remove(i.id)} />
          ))}
          <button type="button" onClick={add} className="w-full rounded-2xl border-2 border-dashed border-line hover:border-ink py-3 font-extrabold text-ink inline-flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" /> {t({ en: "Add a line", ur: "لائن شامل کریں" })}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-cream border border-line p-4">
          <label className="font-extrabold text-ink" htmlFor="quote-total">
            {t({ en: "Total written on the quote", ur: "تخمینے پر لکھی کل رقم" })}
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
            {t({ en: "Lines add up to", ur: "لائنوں کا جوڑ" })} <strong className="latin">{money(lineTotal(items))}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={run}
          className="mt-5 w-full h-14 rounded-2xl bg-ink hover:bg-black text-white text-lg font-black inline-flex items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" /> {t({ en: "Check this quote", ur: "یہ تخمینہ چیک کریں" })}
        </button>
        {empty && (
          <p className="mt-3 text-center font-bold text-danger">
            {t({ en: "Add at least one line with an amount, or use the sample quote.", ur: "کم از کم ایک لائن رقم کے ساتھ لکھیں، یا نمونہ تخمینہ لگائیں۔" })}
          </p>
        )}
      </Card>

      {findings && (
        <div ref={resultsRef} className="space-y-3 scroll-mt-24">
          <Card className={serious > 0 ? "border-amber" : "border-leaf"}>
            <p className="text-2xl font-black text-ink ur-tight">
              {serious > 0
                ? t({ en: `Ask before you agree: ${serious} things need clarifying`, ur: `ہاں کرنے سے پہلے پوچھیں: ${serious} باتیں واضح کرنی ہیں` })
                : t({ en: "This quote looks complete", ur: "یہ تخمینہ مکمل لگتا ہے" })}
            </p>
            <p className="mt-2 text-ink-soft font-semibold">
              {t({
                en: "This doesn't mean anyone is cheating. Quotes often leave things out. These polite questions help you agree on the full job.",
                ur: "اس کا مطلب یہ نہیں کہ کوئی دھوکا دے رہا ہے۔ تخمینوں میں اکثر چیزیں رہ جاتی ہیں۔ یہ شائستہ سوال پورے کام پر اتفاق میں مدد دیتے ہیں۔",
              })}
            </p>
          </Card>

          {findings.map((f) => (
            <FindingCard key={f.id} f={f} />
          ))}

          {findings.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(waText).then(() => setCopied(true)).catch(() => setCopied(false));
                }}
                className="h-14 rounded-2xl border-2 border-ink bg-white font-extrabold text-ink inline-flex items-center justify-center gap-2 hover:bg-sun-soft"
              >
                <Copy className="h-5 w-5" /> {copied ? t({ en: "Copied!", ur: "کاپی ہو گیا!" }) : t({ en: "Copy all questions", ur: "تمام سوال کاپی کریں" })}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                className="h-14 rounded-2xl bg-[#1fa855] text-white font-extrabold inline-flex items-center justify-center gap-2 hover:brightness-95"
              >
                <MessageCircle className="h-5 w-5" /> {t({ en: "Send to contractor on WhatsApp", ur: "ٹھیکیدار کو واٹس ایپ کریں" })}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LineRow({ item, onChange, onRemove }: { item: LineItem; onChange: (p: Partial<LineItem>) => void; onRemove: () => void }) {
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
        <button type="button" onClick={onRemove} className="h-10 w-10 shrink-0 rounded-xl grid place-items-center text-ink-soft hover:text-danger hover:bg-danger-soft" aria-label={t({ en: "Remove line", ur: "لائن ہٹائیں" })}>
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
            placeholder={t({ en: "Size", ur: "سائز" })}
            className="w-24 rounded-xl bg-cream/60 border border-line focus:border-ink outline-none px-3 py-1.5 font-bold latin"
          />
          <input
            value={item.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder={t({ en: "sq ft / litre", ur: "مربع فٹ / لیٹر" })}
            className="w-32 rounded-xl bg-cream/60 border border-line focus:border-ink outline-none px-3 py-1.5 font-bold"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setShowSize(true)} className="mt-2 text-sm font-bold text-sky-dark inline-flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t({ en: "Add size (sq ft, litres…)", ur: "سائز لکھیں (مربع فٹ، لیٹر…)" })}
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
        ? { border: "border-amber", badge: "bg-amber-soft text-[#8a5a00]", label: t({ en: "Ask about this", ur: "اس بارے میں پوچھیں" }), Icon: CircleHelp }
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
