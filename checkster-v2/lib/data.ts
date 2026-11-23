// ============================================================
// Checkster data
// Everything here is either:
//   OFFICIAL – a real published government figure, with source + date
//   SAMPLE   – demo data for the prototype, always labelled in the UI
// Later this file is replaced by the FastAPI backend.
// ============================================================

import type { Tx } from "./i18n";

export type Trade = "plumber" | "mason" | "waterproofing" | "painter" | "electrician" | "carpenter";
export type ProblemId = "damp" | "leak" | "crack" | "roof" | "wiring";
export type Answer = "yes" | "no" | "unsure";

// ---------- Problems ----------
export const PROBLEMS: { id: ProblemId; title: Tx; line: Tx; ready: boolean; danger?: boolean }[] = [
  {
    id: "damp",
    title: { en: "Seelan / damp wall", ur: "دیوار میں سیلن" },
    line: { en: "Stains, peeling paint, white powder", ur: "دھبے، اکھڑتا رنگ، سفید پاؤڈر" },
    ready: true,
  },
  {
    id: "leak",
    title: { en: "Pani ka leak", ur: "پانی کا رساؤ" },
    line: { en: "Dripping pipes, taps, tanks", ur: "ٹپکتے پائپ، نلکے، ٹینکی" },
    ready: false,
  },
  {
    id: "crack",
    title: { en: "Darar / crack", ur: "دیوار میں دراڑ" },
    line: { en: "Cracks in walls or plaster", ur: "دیوار یا پلستر میں دراڑیں" },
    ready: false,
  },
  {
    id: "roof",
    title: { en: "Chhat tapakna", ur: "چھت ٹپکنا" },
    line: { en: "Roof leaking in the rain", ur: "بارش میں چھت سے پانی" },
    ready: false,
  },
  {
    id: "wiring",
    title: { en: "Bijli / wiring", ur: "بجلی کی وائرنگ" },
    line: { en: "Sparks, burning smell — call a pro", ur: "چنگاری، جلنے کی بو — ماہر کو بلائیں" },
    ready: false,
    danger: true,
  },
];

export const ROOMS: { id: string; label: Tx }[] = [
  { id: "bedroom", label: { en: "Bedroom", ur: "بیڈروم" } },
  { id: "drawing", label: { en: "Drawing room", ur: "ڈرائنگ روم" } },
  { id: "kitchen", label: { en: "Kitchen", ur: "کچن" } },
  { id: "bathroom", label: { en: "Bathroom", ur: "باتھ روم" } },
  { id: "outside", label: { en: "Outside wall", ur: "باہر کی دیوار" } },
];

export const CITIES: { id: string; label: Tx }[] = [
  { id: "peshawar", label: { en: "Peshawar", ur: "پشاور" } },
  { id: "islamabad", label: { en: "Islamabad", ur: "اسلام آباد" } },
  { id: "rawalpindi", label: { en: "Rawalpindi", ur: "راولپنڈی" } },
  { id: "lahore", label: { en: "Lahore", ur: "لاہور" } },
  { id: "karachi", label: { en: "Karachi", ur: "کراچی" } },
  { id: "swat", label: { en: "Swat", ur: "سوات" } },
];

export const AREAS: { id: string; label: Tx }[] = [
  { id: "hayatabad", label: { en: "Hayatabad", ur: "حیات آباد" } },
  { id: "university-town", label: { en: "University Town", ur: "یونیورسٹی ٹاؤن" } },
  { id: "gulbahar", label: { en: "Gulbahar", ur: "گلبہار" } },
  { id: "saddar", label: { en: "Saddar", ur: "صدر" } },
  { id: "warsak-road", label: { en: "Warsak Road", ur: "ورسک روڈ" } },
  { id: "dalazak-road", label: { en: "Dalazak Road", ur: "دلہ زاک روڈ" } },
];

export const QUICK_PHRASES: Tx[] = [
  { en: "Deewar mein seelan hai", ur: "دیوار میں سیلن ہے" },
  { en: "Paint is peeling off", ur: "رنگ اکھڑ رہا ہے" },
  { en: "Worse after rain", ur: "بارش کے بعد زیادہ ہو جاتا ہے" },
  { en: "Bathroom is behind this wall", ur: "دیوار کے پیچھے باتھ روم ہے" },
];

export const TRADES: { id: Trade; label: Tx }[] = [
  { id: "plumber", label: { en: "Plumber", ur: "پلمبر" } },
  { id: "mason", label: { en: "Mason (mistri)", ur: "مستری" } },
  { id: "waterproofing", label: { en: "Waterproofing", ur: "واٹر پروفنگ" } },
  { id: "painter", label: { en: "Painter", ur: "پینٹر" } },
  { id: "electrician", label: { en: "Electrician", ur: "الیکٹریشن" } },
  { id: "carpenter", label: { en: "Carpenter (tarkhan)", ur: "ترکھان" } },
];

export const tradeLabel = (id: Trade) => TRADES.find((t) => t.id === id)!.label;

// ---------- What the photo scan "sees" (SAMPLE) ----------
export const OBSERVATIONS: { id: string; text: Tx; box: { x: number; y: number; w: number; h: number } }[] = [
  { id: "o1", text: { en: "Paint bubbling and peeling", ur: "رنگ پھول کر اکھڑ رہا ہے" }, box: { x: 52, y: 30, w: 24, h: 24 } },
  { id: "o2", text: { en: "Dark water stain spreading from the corner", ur: "کونے سے پھیلتا پانی کا گہرا دھبہ" }, box: { x: 10, y: 52, w: 34, h: 38 } },
  { id: "o3", text: { en: "White powder on plaster (shora)", ur: "پلستر پر سفید پاؤڈر (شورہ)" }, box: { x: 46, y: 64, w: 26, h: 24 } },
];

// ---------- The experts' group chat (SAMPLE AI discussion) ----------
export type Speaker = "checkster" | "plumber" | "mason" | "waterproofing";

export const EXPERTS: Record<Exclude<Speaker, "checkster">, { name: Tx }> = {
  plumber: { name: { en: "Plumber expert", ur: "پلمبر ماہر" } },
  mason: { name: { en: "Mason expert", ur: "مستری ماہر" } },
  waterproofing: { name: { en: "Waterproofing expert", ur: "واٹر پروفنگ ماہر" } },
};

export interface ChatLine {
  who: Speaker;
  text: Tx;
}

export const CHAT_OPENING: ChatLine[] = [
  {
    who: "checkster",
    text: {
      en: "Salaam! I've shown your photo to 3 experts. Let's hear what they think.",
      ur: "السلام علیکم! میں نے آپ کی تصویر تین ماہرین کو دکھائی ہے۔ آئیے سنتے ہیں وہ کیا کہتے ہیں۔",
    },
  },
  {
    who: "plumber",
    text: {
      en: "The stain is darkest near the corner. If there's a bathroom behind this wall, a hidden pipe joint could be leaking.",
      ur: "دھبہ کونے کے پاس سب سے گہرا ہے۔ اگر اس دیوار کے پیچھے باتھ روم ہے تو کوئی چھپا ہوا پائپ جوڑ لیک ہو سکتا ہے۔",
    },
  },
  {
    who: "mason",
    text: {
      en: "I'm not fully sure it's a pipe. The white powder (shora) is low on the wall. That also happens when ground moisture climbs up the wall.",
      ur: "مجھے پورا یقین نہیں کہ یہ پائپ ہے۔ سفید پاؤڈر (شورہ) دیوار کے نچلے حصے پر ہے۔ یہ زمین کی نمی اوپر چڑھنے سے بھی ہوتا ہے۔",
    },
  },
  {
    who: "waterproofing",
    text: {
      en: "If it gets worse after rain, outside water may be getting in. One thing we all agree on: new paint alone will not fix this.",
      ur: "اگر بارش کے بعد یہ بڑھ جاتا ہے تو باہر کا پانی اندر آ رہا ہو سکتا ہے۔ ایک بات پر ہم سب متفق ہیں: صرف نیا رنگ کرنے سے یہ ٹھیک نہیں ہوگا۔",
    },
  },
  {
    who: "checkster",
    text: {
      en: "They need 2 quick answers from you. Just tap.",
      ur: "انہیں آپ سے دو مختصر جواب چاہئیں۔ بس ٹیپ کریں۔",
    },
  },
];

export const QUESTIONS: { id: "bathroom" | "rain"; text: Tx }[] = [
  {
    id: "bathroom",
    text: {
      en: "Is there a bathroom or kitchen on the other side of this wall?",
      ur: "کیا اس دیوار کے دوسری طرف باتھ روم یا کچن ہے؟",
    },
  },
  { id: "rain", text: { en: "Does it get worse after rain?", ur: "کیا بارش کے بعد یہ بڑھ جاتا ہے؟" } },
];

export const ANSWER_LABEL: Record<Answer, Tx> = {
  yes: { en: "Yes", ur: "ہاں" },
  no: { en: "No", ur: "نہیں" },
  unsure: { en: "Not sure", ur: "پتا نہیں" },
};

export interface Cause {
  key: "pipe" | "outside" | "rising" | "unsure";
  trade: Trade;
  title: Tx;
  firstStep: Tx;
  confidence: Tx;
  reply: ChatLine[];
}

/** Fixed rules: the two answers decide which expert's idea is most likely. */
export function likelyCause(bathroom: Answer | null, rain: Answer | null): Cause {
  if (bathroom === "yes") {
    return {
      key: "pipe",
      trade: "plumber",
      title: { en: "A leaking pipe inside the wall", ur: "دیوار کے اندر لیک ہوتا پائپ" },
      firstStep: {
        en: "Get a plumber to do a pressure test and fix the leaking joint before any plaster or paint work.",
        ur: "پلستر یا رنگ سے پہلے پلمبر سے پریشر ٹیسٹ کروائیں اور لیک ہوتا جوڑ ٹھیک کروائیں۔",
      },
      confidence: { en: "Fairly likely", ur: "کافی امکان ہے" },
      reply: [
        {
          who: "plumber",
          text: {
            en: "Then my first guess is a leaking pipe joint. A pressure test takes about an hour and will confirm it.",
            ur: "پھر میرا پہلا اندازہ لیک ہوتا پائپ جوڑ ہے۔ پریشر ٹیسٹ میں تقریباً ایک گھنٹہ لگتا ہے اور اس سے تصدیق ہو جائے گی۔",
          },
        },
        {
          who: "mason",
          text: {
            en: "Agreed. Fix the pipe first. Once the wall is dry, the plaster can be redone.",
            ur: "متفق ہوں۔ پہلے پائپ ٹھیک کریں۔ دیوار خشک ہو جائے تو پلستر دوبارہ ہو سکتا ہے۔",
          },
        },
      ],
    };
  }
  if (rain === "yes") {
    return {
      key: "outside",
      trade: "waterproofing",
      title: { en: "Rain water coming in from outside", ur: "باہر سے آتا بارش کا پانی" },
      firstStep: {
        en: "Get the outer wall or roof edge checked and sealed first. Inside repairs come after.",
        ur: "پہلے باہر کی دیوار یا چھت کا کنارہ چیک اور سیل کروائیں۔ اندر کی مرمت اس کے بعد۔",
      },
      confidence: { en: "Fairly likely", ur: "کافی امکان ہے" },
      reply: [
        {
          who: "waterproofing",
          text: {
            en: "That points to water coming in from outside, maybe the roof edge or the outer wall. That needs sealing first.",
            ur: "اس کا مطلب ہے پانی باہر سے آ رہا ہے، شاید چھت کے کنارے یا باہر کی دیوار سے۔ پہلے اسے سیل کرنا ہوگا۔",
          },
        },
        {
          who: "plumber",
          text: {
            en: "Agreed. With no bathroom behind it, a pipe is less likely here.",
            ur: "متفق ہوں۔ پیچھے باتھ روم نہ ہو تو یہاں پائپ کا امکان کم ہے۔",
          },
        },
      ],
    };
  }
  if (bathroom === "no" && rain === "no") {
    return {
      key: "rising",
      trade: "mason",
      title: { en: "Ground moisture rising up the wall", ur: "زمین سے اوپر چڑھتی نمی" },
      firstStep: {
        en: "Get a mason to check the damp-proof layer (DPC) at the bottom of the wall.",
        ur: "مستری سے دیوار کے نیچے والی نمی روکنے والی تہہ (DPC) چیک کروائیں۔",
      },
      confidence: { en: "Possible — needs a check", ur: "ممکن ہے — چیک ضروری ہے" },
      reply: [
        {
          who: "mason",
          text: {
            en: "No bathroom and no rain link. This looks like rising damp. The damp-proof layer at the bottom of the wall may be damaged.",
            ur: "نہ باتھ روم ہے نہ بارش کا تعلق۔ یہ زمین سے چڑھتی نمی لگتی ہے۔ دیوار کے نیچے والی نمی روکنے والی تہہ خراب ہو سکتی ہے۔",
          },
        },
        {
          who: "waterproofing",
          text: {
            en: "Agreed. A chemical damp-proof treatment may be needed, but only after a mason confirms it.",
            ur: "متفق ہوں۔ کیمیکل علاج کی ضرورت پڑ سکتی ہے، مگر صرف مستری کی تصدیق کے بعد۔",
          },
        },
      ],
    };
  }
  return {
    key: "unsure",
    trade: "plumber",
    title: { en: "Not clear yet — start with the cheapest test", ur: "ابھی واضح نہیں — سب سے سستے ٹیسٹ سے شروع کریں" },
    firstStep: {
      en: "Ask a plumber for a pressure test. It rules out a pipe leak in about an hour, and costs the least.",
      ur: "پلمبر سے پریشر ٹیسٹ کروائیں۔ تقریباً ایک گھنٹے میں پائپ لیک کا پتا چل جاتا ہے، اور خرچ بھی سب سے کم ہے۔",
    },
    confidence: { en: "Needs one more check", ur: "ایک اور چیک ضروری ہے" },
    reply: [
      {
        who: "checkster",
        text: {
          en: "No problem. The experts suggest starting with a plumber's pressure test. It's quick and cheap.",
          ur: "کوئی بات نہیں۔ ماہرین کا مشورہ ہے کہ پلمبر کے پریشر ٹیسٹ سے شروع کریں۔ یہ جلدی بھی ہے اور سستا بھی۔",
        },
      },
    ],
  };
}

export const REPAIR_STEPS: Tx[] = [
  { en: "Find and fix where the water comes from", ur: "پانی کہاں سے آ رہا ہے، وہ ڈھونڈ کر ٹھیک کریں" },
  { en: "Scrape off the damaged plaster and paint", ur: "خراب پلستر اور رنگ کھرچ کر اتاریں" },
  { en: "Let the wall dry fully (1–2 weeks)", ur: "دیوار کو پوری طرح خشک ہونے دیں (1 سے 2 ہفتے)" },
  { en: "Re-plaster where needed", ur: "جہاں ضرورت ہو دوبارہ پلستر کریں" },
  { en: "Primer and paint only after it's dry", ur: "خشک ہونے کے بعد ہی پرائمر اور رنگ" },
];

export const SAFETY_NOTE: Tx = {
  en: "If water is near a switch, socket or wiring, switch off that circuit and call an electrician. Don't touch wet switches.",
  ur: "اگر پانی کسی سوئچ، ساکٹ یا وائرنگ کے قریب ہے تو اس سرکٹ کی بجلی بند کریں اور الیکٹریشن کو بلائیں۔ گیلے سوئچ کو ہاتھ نہ لگائیں۔",
};

// ---------- OFFICIAL government rates (real, with source + date) ----------
export type SourceKey = "pbs" | "punjab" | "sample";

export const SOURCES: Record<SourceKey, { name: Tx; date: Tx; url?: string }> = {
  pbs: {
    name: {
      en: "Pakistan Bureau of Statistics (SPI), national average",
      ur: "پاکستان ادارہ شماریات (SPI)، قومی اوسط",
    },
    date: { en: "Reported Jan 2026", ur: "جنوری 2026 کی رپورٹ" },
    url: "https://profit.pakistantoday.com.pk/2026/01/04/input-prices-cool-labour-costs-rise-as-construction-activity-shows-mixed-signals/",
  },
  punjab: {
    name: {
      en: "Finance Department Punjab, labour rates for government works",
      ur: "محکمہ خزانہ پنجاب، سرکاری کاموں کے مزدوری ریٹ",
    },
    date: { en: "Jul–Dec 2026", ur: "جولائی تا دسمبر 2026" },
    url: "https://propakistani.pk/2026/07/21/punjab-announces-new-per-day-wages-for-daily-wage-workers/",
  },
  sample: {
    name: { en: "Sample price, not yet verified", ur: "نمونہ قیمت، ابھی تصدیق شدہ نہیں" },
    date: { en: "Demo data", ur: "ڈیمو ڈیٹا" },
  },
};

export interface OfficialRate {
  id: string;
  trade: Trade | "skilled";
  label: Tx;
  amount: number;
  per: Tx;
  source: SourceKey;
}

const PER_DAY: Tx = { en: "per day", ur: "فی دن" };

export const OFFICIAL_RATES: OfficialRate[] = [
  { id: "mason", trade: "mason", label: { en: "Mason (raj mistri)", ur: "مستری (راج)" }, amount: 1987, per: PER_DAY, source: "pbs" },
  { id: "plumber", trade: "plumber", label: { en: "Plumber", ur: "پلمبر" }, amount: 1754, per: PER_DAY, source: "pbs" },
  { id: "painter", trade: "painter", label: { en: "Painter", ur: "پینٹر" }, amount: 1709, per: PER_DAY, source: "pbs" },
  {
    id: "electrician",
    trade: "electrician",
    label: { en: "Electrician", ur: "الیکٹریشن" },
    amount: 279,
    per: { en: "per point", ur: "فی پوائنٹ" },
    source: "pbs",
  },
  {
    id: "skilled",
    trade: "skilled",
    label: { en: "Any skilled worker (govt. works)", ur: "کوئی بھی ہنر مند کاریگر (سرکاری کام)" },
    amount: 2000,
    per: PER_DAY,
    source: "punjab",
  },
];

/** Daily-rate range for a trade: PBS average (low) → Punjab govt. skilled rate (high). */
export function officialDayRange(trade: Trade): [number, number] {
  const pbs = OFFICIAL_RATES.find((r) => r.trade === trade && r.per === PER_DAY);
  const skilled = OFFICIAL_RATES.find((r) => r.id === "skilled")!.amount;
  const low = pbs ? pbs.amount : skilled;
  return [Math.min(low, skilled), Math.max(low, skilled)];
}

// ---------- Fair price estimate (labour = OFFICIAL, materials = SAMPLE) ----------
export interface EstimateRow {
  id: string;
  work: Tx;
  low: number;
  high: number;
  source: SourceKey;
}

export function fairEstimate(cause: Cause, areaSqft: number): EstimateRow[] {
  const a = Math.max(10, areaSqft || 40);
  const [pl, ph] = officialDayRange("plumber");
  const [ml, mh] = officialDayRange("mason");
  const [pal, pah] = officialDayRange("painter");
  const fixSource: EstimateRow =
    cause.trade === "waterproofing"
      ? {
          id: "fix",
          work: { en: "Seal the outside wall / roof edge (labour, 1–2 days)", ur: "باہر کی دیوار / چھت کا کنارہ سیل کرنا (مزدوری، 1 سے 2 دن)" },
          low: ml,
          high: mh * 2,
          source: "pbs",
        }
      : cause.trade === "mason"
        ? {
            id: "fix",
            work: { en: "Check and repair the damp-proof layer (mason, 1–2 days)", ur: "نمی روکنے والی تہہ چیک اور مرمت (مستری، 1 سے 2 دن)" },
            low: ml,
            high: mh * 2,
            source: "pbs",
          }
        : {
            id: "fix",
            work: { en: "Find and fix the leaking pipe (plumber, 1 day)", ur: "لیک ہوتا پائپ ڈھونڈ کر ٹھیک کرنا (پلمبر، 1 دن)" },
            low: pl,
            high: ph,
            source: "pbs",
          };
  return [
    fixSource,
    {
      id: "parts",
      work: { en: "Pipe fittings / sealant (materials)", ur: "پائپ فٹنگ / سیلنٹ (سامان)" },
      low: 1000,
      high: 3500,
      source: "sample",
    },
    {
      id: "plaster",
      work: { en: "Scrape and re-plaster (mason, 1–2 days)", ur: "کھرچائی اور دوبارہ پلستر (مستری، 1 سے 2 دن)" },
      low: ml,
      high: mh * 2,
      source: "pbs",
    },
    {
      id: "plaster-mat",
      work: { en: `Plaster materials (~${a} sq ft)`, ur: `پلستر کا سامان (تقریباً ${a} مربع فٹ)` },
      low: a * 40,
      high: a * 70,
      source: "sample",
    },
    {
      id: "paint",
      work: { en: "Primer and paint (painter, 1 day)", ur: "پرائمر اور رنگ (پینٹر، 1 دن)" },
      low: pal,
      high: pah,
      source: "pbs",
    },
    {
      id: "paint-mat",
      work: { en: `Paint and putty (~${a} sq ft)`, ur: `رنگ اور پٹی (تقریباً ${a} مربع فٹ)` },
      low: a * 35,
      high: a * 60,
      source: "sample",
    },
  ];
}

// ---------- Contractor quote (SAMPLE — the fictional PKR 57,000 demo quote) ----------
export interface LineItem {
  id: string;
  work: string;
  quantity: number | null;
  unit: string;
  amount: number;
}

export const SAMPLE_QUOTE: LineItem[] = [
  { id: "q1", work: "Wall scraping", quantity: null, unit: "", amount: 8000 },
  { id: "q2", work: "Chemical waterproof coating", quantity: null, unit: "", amount: 22000 },
  { id: "q3", work: "Putty and paint", quantity: null, unit: "", amount: 15000 },
  { id: "q4", work: "Labour", quantity: null, unit: "", amount: 12000 },
];
export const SAMPLE_QUOTE_TOTAL = 57000;

// ---------- Kaarigars near you (SAMPLE profiles for the demo) ----------
export interface WorkerOffer {
  id: string;
  name: Tx;
  initials: string;
  trade: Trade;
  rating: number;
  jobs: number;
  years: number;
  km: number;
  eta: number;
  /** 0 = accepts your price, otherwise asks for this much more */
  extra: number;
  pin: { x: number; y: number };
  tone: string;
}

export const WORKERS: WorkerOffer[] = [
  { id: "w1", name: { en: "Ustad Rahim", ur: "استاد رحیم" }, initials: "UR", trade: "plumber", rating: 4.9, jobs: 212, years: 14, km: 1.2, eta: 12, extra: 0, pin: { x: 268, y: 92 }, tone: "bg-sky" },
  { id: "w2", name: { en: "Bilal Khan", ur: "بلال خان" }, initials: "BK", trade: "plumber", rating: 4.7, jobs: 96, years: 6, km: 2.6, eta: 20, extra: 800, pin: { x: 96, y: 70 }, tone: "bg-leaf" },
  { id: "w3", name: { en: "Shahid Mistri", ur: "شاہد مستری" }, initials: "SM", trade: "mason", rating: 4.8, jobs: 154, years: 18, km: 3.1, eta: 25, extra: 0, pin: { x: 318, y: 196 }, tone: "bg-amber" },
  { id: "w4", name: { en: "Noor Waterproofing", ur: "نور واٹر پروفنگ" }, initials: "NW", trade: "waterproofing", rating: 4.6, jobs: 61, years: 9, km: 4.4, eta: 32, extra: 1500, pin: { x: 58, y: 200 }, tone: "bg-brand" },
  { id: "w5", name: { en: "Aqeel Painter", ur: "عقیل پینٹر" }, initials: "AP", trade: "painter", rating: 4.5, jobs: 40, years: 5, km: 1.9, eta: 15, extra: 0, pin: { x: 150, y: 214 }, tone: "bg-ink" },
];

// ---------- Jobs a kaarigar sees in the worker app (SAMPLE) ----------
export interface JobRequest {
  id: string;
  problem: ProblemId;
  title: Tx;
  checksterSays: Tx;
  area: Tx;
  size: Tx;
  when: Tx;
  km: number;
  offer: number;
}

export const JOB_REQUESTS: JobRequest[] = [
  {
    id: "r1",
    problem: "damp",
    title: { en: "Damp wall next to bathroom", ur: "باتھ روم کے ساتھ والی دیوار میں سیلن" },
    checksterSays: { en: "Likely a leaking pipe joint. Pressure test needed.", ur: "غالباً پائپ کا جوڑ لیک ہے۔ پریشر ٹیسٹ ضروری ہے۔" },
    area: { en: "Hayatabad Phase 3", ur: "حیات آباد فیز 3" },
    size: { en: "About 40 sq ft", ur: "تقریباً 40 مربع فٹ" },
    when: { en: "Today, after 4 pm", ur: "آج، شام 4 بجے کے بعد" },
    km: 2.4,
    offer: 4500,
  },
  {
    id: "r2",
    problem: "leak",
    title: { en: "Tap leaking under kitchen sink", ur: "کچن کے سنک کے نیچے نلکا لیک" },
    checksterSays: { en: "Loose fitting or worn washer. Small job.", ur: "ڈھیلی فٹنگ یا گھسا ہوا واشر۔ چھوٹا کام۔" },
    area: { en: "University Town", ur: "یونیورسٹی ٹاؤن" },
    size: { en: "1 tap", ur: "1 نلکا" },
    when: { en: "Tomorrow morning", ur: "کل صبح" },
    km: 3.8,
    offer: 1500,
  },
  {
    id: "r3",
    problem: "damp",
    title: { en: "Seelan in bedroom, worse after rain", ur: "بیڈروم میں سیلن، بارش کے بعد زیادہ" },
    checksterSays: { en: "Rain water from outside wall. Check roof edge.", ur: "باہر کی دیوار سے بارش کا پانی۔ چھت کا کنارہ چیک کریں۔" },
    area: { en: "Gulbahar", ur: "گلبہار" },
    size: { en: "About 60 sq ft", ur: "تقریباً 60 مربع فٹ" },
    when: { en: "This week", ur: "اس ہفتے" },
    km: 5.1,
    offer: 6000,
  },
];
