// ============================================================
// Checkster quote check — fixed rules, no AI.
// AI (later) only READS the contractor's quote. This code does
// all checking and maths, so every result can be explained.
// We never call a contractor dishonest — we only say what to ask.
// ============================================================

import type { Tx } from "./i18n";
import { OFFICIAL_RATES, type LineItem } from "./data";

export type Severity = "high" | "medium" | "info";

export interface Finding {
  id: string;
  severity: Severity;
  title: Tx;
  item: string;
  explain: Tx;
  ask: Tx;
}

const SURFACE_WORDS = ["paint", "putty", "coating", "scrap", "plaster", "distemper", "rang"];
const SOURCE_WORDS = ["leak", "pipe", "plumb", "seal", "drain", "damp proof", "dpc", "inspect", "source", "test"];
const TREATMENT_WORDS = ["coating", "waterproof", "chemical"];

const has = (text: string, words: string[]) => words.some((w) => text.toLowerCase().includes(w));
const fmt = (n: number) => Math.round(n).toLocaleString("en-PK");

export function lineTotal(items: LineItem[]) {
  return items.reduce((sum, i) => sum + (Number.isFinite(i.amount) ? i.amount : 0), 0);
}

export function auditQuote(items: LineItem[], statedTotal: number | null): Finding[] {
  const clean = items.filter((i) => i.work.trim() !== "");
  const out: Finding[] = [];
  const all = clean.map((i) => i.work).join(" ");

  // 1. Does the total add up?
  if (statedTotal !== null && Number.isFinite(statedTotal)) {
    const sum = lineTotal(clean);
    if (Math.abs(sum - statedTotal) > 1) {
      out.push({
        id: "total",
        severity: "high",
        title: { en: "The total doesn't add up", ur: "کل رقم جمع نہیں ہو رہی" },
        item: "Total",
        explain: {
          en: `The items add up to Rs ${fmt(sum)}, but the quote says Rs ${fmt(statedTotal)}.`,
          ur: `آئٹمز کا جوڑ ${fmt(sum)} روپے ہے، مگر تخمینے میں ${fmt(statedTotal)} روپے لکھا ہے۔`,
        },
        ask: { en: "Can you explain the difference in the total?", ur: "کل رقم میں فرق کی وضاحت کر دیں؟" },
      });
    }
  }

  // 2. Is the cause being fixed, or only the surface?
  if (has(all, SURFACE_WORDS) && !has(all, SOURCE_WORDS)) {
    out.push({
      id: "cause",
      severity: "high",
      title: { en: "Nothing fixes where the water comes from", ur: "پانی کے ذریعے کو ٹھیک کرنے کا کوئی کام نہیں" },
      item: "Whole quote",
      explain: {
        en: "Every item treats the surface of the wall. If the leak isn't fixed first, the seelan can come back after a few months.",
        ur: "ہر آئٹم صرف دیوار کی سطح کا ہے۔ اگر پہلے لیک ٹھیک نہ ہو تو سیلن چند مہینوں میں واپس آ سکتی ہے۔",
      },
      ask: {
        en: "What is causing the moisture, and how will you fix that first?",
        ur: "نمی کی وجہ کیا ہے، اور آپ پہلے اسے کیسے ٹھیک کریں گے؟",
      },
    });
  }

  // 3. Measurements missing?
  const noQty = clean.filter((i) => !i.work.toLowerCase().includes("labour") && (i.quantity === null || !i.unit.trim()));
  if (noQty.length > 0) {
    out.push({
      id: "qty",
      severity: "medium",
      title: { en: "No measurements written", ur: "پیمائش نہیں لکھی گئی" },
      item: noQty.map((i) => i.work).join(", "),
      explain: {
        en: "These lines have no size (like square feet or litres), so nobody can check if the amount fits your wall.",
        ur: "ان آئٹمز میں سائز نہیں لکھا (جیسے مربع فٹ یا لیٹر)، اس لیے کوئی نہیں جانچ سکتا کہ رقم آپ کی دیوار کے حساب سے ہے۔",
      },
      ask: { en: "How many square feet does each item cover?", ur: "ہر کام کتنے مربع فٹ کا ہے؟" },
    });
  }

  // 4. Product details missing?
  clean
    .filter((i) => has(i.work, TREATMENT_WORDS) && i.work.trim().split(/\s+/).length < 5)
    .forEach((i) =>
      out.push({
        id: `spec-${i.id}`,
        severity: "medium",
        title: { en: "Which product? How many coats?", ur: "کون سا پراڈکٹ؟ کتنے کوٹ؟" },
        item: i.work,
        explain: {
          en: "The quote doesn't name the waterproofing product or the number of coats. Two coatings at the same price can be very different.",
          ur: "تخمینے میں واٹر پروفنگ پراڈکٹ کا نام یا کوٹ کی تعداد نہیں لکھی۔ ایک ہی قیمت کی دو کوٹنگز میں بہت فرق ہو سکتا ہے۔",
        },
        ask: {
          en: "Which product (brand and name) will you use, and how many coats?",
          ur: "آپ کون سا پراڈکٹ (برانڈ اور نام) لگائیں گے، اور کتنے کوٹ؟",
        },
      }),
    );

  // 5. Labour charged twice?
  const labour = clean.filter((i) => i.work.toLowerCase().includes("labour"));
  if (labour.length >= 2) {
    out.push({
      id: "double-labour",
      severity: "medium",
      title: { en: "Labour appears more than once", ur: "مزدوری ایک سے زیادہ بار" },
      item: "Labour",
      explain: {
        en: `Labour is charged ${labour.length} times. It may be fine, but it should be explained.`,
        ur: `مزدوری ${labour.length} بار لکھی ہے۔ یہ ٹھیک بھی ہو سکتا ہے، مگر وضاحت ہونی چاہیے۔`,
      },
      ask: { en: "What does each labour charge cover?", ur: "ہر مزدوری کس کام کی ہے؟" },
    });
  }

  // 6. Compare labour with the OFFICIAL daily rate
  const skilled = OFFICIAL_RATES.find((r) => r.id === "skilled")!.amount;
  const labourTotal = labour.reduce((s, i) => s + i.amount, 0);
  if (labourTotal > 0) {
    const days = labourTotal / skilled;
    out.push({
      id: "official-labour",
      severity: "info",
      title: { en: "Labour vs. official rate", ur: "مزدوری بمقابلہ سرکاری ریٹ" },
      item: "Labour",
      explain: {
        en: `Rs ${fmt(labourTotal)} equals about ${days.toFixed(1)} worker-days at the government rate of Rs ${fmt(skilled)}/day (Finance Dept. Punjab, Jul–Dec 2026). That's normal if that many people and days are needed.`,
        ur: `${fmt(labourTotal)} روپے سرکاری ریٹ ${fmt(skilled)} روپے فی دن (محکمہ خزانہ پنجاب، جولائی تا دسمبر 2026) کے حساب سے تقریباً ${days.toFixed(1)} کاریگر-دن بنتے ہیں۔ اگر اتنے لوگ اور دن لگیں تو یہ ٹھیک ہے۔`,
      },
      ask: {
        en: "How many workers will come, and for how many days?",
        ur: "کتنے کاریگر آئیں گے، اور کتنے دن کے لیے؟",
      },
    });
  }

  return out;
}
