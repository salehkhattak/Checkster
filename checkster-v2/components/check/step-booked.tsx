"use client";
import type { ReactNode } from "react";

import { CheckCircle2, ClipboardCheck, MessageCircle, Printer, Star } from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { AREAS, PROBLEMS, SAFETY_NOTE, officialDayRange, tradeLabel, type Cause, type ProblemId, type WorkerOffer } from "@/lib/data";
import { DemoTag, Mascot } from "@/components/site/brand";
import { Card, CardTitle } from "./shell";
import { NeighbourhoodMap, TONE_COLOR } from "./map";

const BEFORE_YOU_PAY: Tx[] = [
  { en: "Ask to see where the water was coming from, and how it was fixed.", ur: "پوچھیں کہ پانی کہاں سے آ رہا تھا، اور اسے کیسے ٹھیک کیا گیا۔" },
  { en: "After a pipe repair, use the tap or shower for a day and check that no new damp appears.", ur: "پائپ کی مرمت کے بعد ایک دن نلکا یا شاور استعمال کریں اور دیکھیں کہ نئی سیلن تو نہیں آئی۔" },
  { en: "Don't paint until the wall is fully dry (1–2 weeks).", ur: "دیوار پوری طرح خشک ہونے تک رنگ نہ کروائیں (1 سے 2 ہفتے)۔" },
  { en: "Get a written bill with sizes and product names.", ur: "سائز اور پراڈکٹ کے ناموں کے ساتھ لکھا ہوا بل لیں۔" },
];

export function StepBooked({ worker, price, cause, problem }: { worker: WorkerOffer; price: number; cause: Cause; problem: ProblemId }) {
  const { t, money } = useLang();
  const [lo, hi] = officialDayRange(worker.trade === "electrician" || worker.trade === "carpenter" ? "mason" : worker.trade);
  const problemTitle = t(PROBLEMS.find((p) => p.id === problem)!.title);

  const report = [
    t({ en: "Checkster report", ur: "چیکسٹر رپورٹ" }),
    `${t({ en: "Problem", ur: "مسئلہ" })}: ${problemTitle}`,
    `${t({ en: "Most likely cause", ur: "ممکنہ وجہ" })}: ${t(cause.title)}`,
    `${t({ en: "Do this first", ur: "پہلے یہ کریں" })}: ${t(cause.firstStep)}`,
    `${t({ en: "Kaarigar", ur: "کاریگر" })}: ${t(worker.name)} (${t(tradeLabel(worker.trade))}), ${money(price)}`,
    "",
    t({ en: "Before paying:", ur: "ادائیگی سے پہلے:" }),
    ...BEFORE_YOU_PAY.map((b, i) => `${i + 1}. ${t(b)}`),
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-leaf text-white p-6 flex items-center gap-4 pop-in no-print">
        <CheckCircle2 className="h-12 w-12 shrink-0" />
        <div>
          <p className="text-2xl sm:text-3xl font-black leading-tight ur-tight">
            {t({ en: `${worker.name.en} is on the way`, ur: `${worker.name.ur} آ رہے ہیں` })}
          </p>
          <p className="font-bold text-white/85">
            {t({ en: `About ${worker.eta} minutes · agreed price`, ur: `تقریباً ${worker.eta} منٹ · طے شدہ قیمت` })} <span className="latin">{money(price)}</span>
          </p>
        </div>
      </div>

      <div className="no-print">
        <NeighbourhoodMap
          pins={[{ id: worker.id, x: worker.pin.x, y: worker.pin.y, label: worker.initials, color: TONE_COLOR[worker.tone] }]}
          routeTo={{ id: worker.id, x: worker.pin.x, y: worker.pin.y, label: worker.initials, color: TONE_COLOR[worker.tone] }}
          homeLabel={t({ en: "You", ur: "آپ" })}
          areaLabel={t(AREAS[0].label)}
        />
        <div className="mt-2 flex items-center gap-2">
          <DemoTag />
          <span className="text-xs font-bold text-ink-soft">{t({ en: "Live tracking comes later. This is a demo.", ur: "لائیو ٹریکنگ بعد میں آئے گی۔ یہ ڈیمو ہے۔" })}</span>
        </div>
      </div>

      <Card>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-brand" /> {t({ en: "Before you pay", ur: "ادائیگی سے پہلے" })}
          </span>
        </CardTitle>
        <ol className="space-y-3">
          {BEFORE_YOU_PAY.map((b, i) => (
            <li key={b.en} className="flex gap-3 items-start">
              <span className="h-7 w-7 shrink-0 rounded-full bg-sun border-2 border-ink text-sm font-black grid place-items-center latin">{i + 1}</span>
              <span className="font-bold text-ink pt-0.5">{t(b)}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* the report — this is what prints */}
      <Card className="print:border-0">
        <div className="flex items-center gap-3">
          <Mascot size={44} />
          <div>
            <p className="font-black text-xl text-ink">{t({ en: "Your Checkster report", ur: "آپ کی چیکسٹر رپورٹ" })}</p>
            <p className="text-sm text-ink-soft font-bold">{t({ en: "Keep it, print it, or send it to family.", ur: "اسے محفوظ کریں، پرنٹ کریں، یا گھر والوں کو بھیجیں۔" })}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <Row k={t({ en: "Problem", ur: "مسئلہ" })} v={problemTitle} />
          <Row k={t({ en: "Most likely cause", ur: "ممکنہ وجہ" })} v={t(cause.title)} />
          <Row k={t({ en: "Do this first", ur: "پہلے یہ کریں" })} v={t(cause.firstStep)} wide />
          <Row
            k={t({ en: "Kaarigar", ur: "کاریگر" })}
            v={
              <span className="inline-flex items-center gap-1.5">
                {t(worker.name)} · {t(tradeLabel(worker.trade))} · <Star className="h-3.5 w-3.5 fill-sun text-sun" /> <span className="latin">{worker.rating}</span>
              </span>
            }
          />
          <Row k={t({ en: "Agreed price", ur: "طے شدہ قیمت" })} v={<span className="latin">{money(price)}</span>} />
          <Row
            k={t({ en: "Official day rate (reference)", ur: "سرکاری یومیہ ریٹ (حوالہ)" })}
            v={
              <span className="latin">
                {money(lo)} – {money(hi)} {t({ en: "per day", ur: "فی دن" })}
              </span>
            }
            wide
          />
        </dl>
        <p className="mt-4 rounded-2xl bg-danger-soft p-3 text-sm font-bold text-ink">{t(SAFETY_NOTE)}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-14 rounded-2xl border-2 border-ink bg-white font-extrabold text-ink inline-flex items-center justify-center gap-2 hover:bg-sun-soft"
          >
            <Printer className="h-5 w-5" /> {t({ en: "Print or save as PDF", ur: "پرنٹ یا PDF محفوظ کریں" })}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(report)}`}
            target="_blank"
            rel="noreferrer"
            className="h-14 rounded-2xl bg-[#1fa855] text-white font-extrabold inline-flex items-center justify-center gap-2 hover:brightness-95"
          >
            <MessageCircle className="h-5 w-5" /> {t({ en: "Send to family on WhatsApp", ur: "گھر والوں کو واٹس ایپ کریں" })}
          </a>
        </div>
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
