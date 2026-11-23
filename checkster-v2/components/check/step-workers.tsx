"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Clock, Minus, Pencil, Plus, Send, Star, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AREAS, TRADES, WORKERS, tradeLabel, type Trade, type WorkerOffer } from "@/lib/data";
import { DemoTag } from "@/components/site/brand";
import { TradePicture } from "@/components/site/illustrations";
import { Card, CardTitle, Chip } from "./shell";
import { NeighbourhoodMap, TONE_COLOR } from "./map";

// Suggested starting offer for one visit + small repair (official day rate + parts)
export const SUGGESTED: Record<Trade, number> = {
  plumber: 4500,
  mason: 6000,
  waterproofing: 8000,
  painter: 5000,
  electrician: 2500,
  carpenter: 4000,
};

export type WhenId = "today" | "tomorrow" | "week";
const WHEN: { id: WhenId; label: { en: string; ur: string } }[] = [
  { id: "today", label: { en: "Today", ur: "آج" } },
  { id: "tomorrow", label: { en: "Tomorrow", ur: "کل" } },
  { id: "week", label: { en: "This week", ur: "اس ہفتے" } },
];

export function StepWorkers({
  trade,
  setTrade,
  offer,
  setOffer,
  when,
  setWhen,
  sent,
  setSent,
  onAccept,
}: {
  trade: Trade;
  setTrade: (t: Trade) => void;
  offer: number;
  setOffer: (n: number) => void;
  when: WhenId;
  setWhen: (w: WhenId) => void;
  sent: boolean;
  setSent: (b: boolean) => void;
  onAccept: (w: WorkerOffer, price: number) => void;
}) {
  const { t, money } = useLang();
  const base = SUGGESTED[trade];
  const low = Math.round((base * 0.7) / 100) * 100;
  const high = Math.round((base * 1.3) / 100) * 100;
  const pct = Math.min(100, Math.max(0, ((offer - low) / (high - low)) * 100));

  if (!sent) {
    return (
      <div className="space-y-5">
        <Card>
          <CardTitle>{t({ en: "Who do you need?", ur: "آپ کو کون چاہیے؟" })}</CardTitle>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TRADES.map((tr) => (
              <button
                key={tr.id}
                type="button"
                onClick={() => {
                  setTrade(tr.id);
                  setOffer(SUGGESTED[tr.id]);
                }}
                aria-pressed={trade === tr.id}
                className={`rounded-2xl border-2 p-2 flex flex-col items-center text-center ${trade === tr.id ? "border-ink bg-sun-soft" : "border-line bg-white hover:border-ink"}`}
              >
                <TradePicture trade={tr.id} size={52} bg={trade === tr.id ? "#fff" : "var(--sand)"} />
                <span className="mt-1 text-xs sm:text-sm font-extrabold text-ink leading-tight ur-tight">{t(tr.label)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle sub={t({ en: "Kaarigars nearby will accept it or reply with their price.", ur: "قریبی کاریگر اسے قبول کریں گے یا اپنی قیمت بتائیں گے۔" })}>
            {t({ en: "Your offer", ur: "آپ کی پیشکش" })}
          </CardTitle>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setOffer(Math.max(500, offer - 500))}
              className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sand"
              aria-label="-500"
            >
              <Minus className="h-6 w-6" />
            </button>
            <p className="text-3xl sm:text-5xl font-black text-ink text-center latin whitespace-nowrap">{money(offer)}</p>
            <button
              type="button"
              onClick={() => setOffer(offer + 500)}
              className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sand"
              aria-label="+500"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {/* fair range bar */}
          <div className="mt-6">
            <div className="relative h-3 rounded-full bg-amber-soft">
              <div className="absolute inset-y-0 start-[20%] end-[20%] rounded-full bg-leaf/70" />
              <span className="absolute -top-1.5 h-6 w-6 rounded-full bg-ink border-4 border-white shadow" style={{ insetInlineStart: `calc(${pct}% - 12px)` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs font-bold text-ink-soft latin">
              <span>{money(low)}</span>
              <span className="text-[#0f6b43]">{t({ en: "Fair range", ur: "مناسب حد" })}</span>
              <span>{money(high)}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-center text-ink-soft">
              {offer < low
                ? t({ en: "Very low offers often get no replies.", ur: "بہت کم پیشکش پر اکثر جواب نہیں آتا۔" })
                : offer > high
                  ? t({ en: "You may be offering more than needed.", ur: "شاید آپ ضرورت سے زیادہ پیشکش کر رہے ہیں۔" })
                  : t({ en: "Good offer. Based on official day rates plus small parts.", ur: "اچھی پیشکش۔ سرکاری یومیہ ریٹ اور چھوٹے پرزوں کی بنیاد پر۔" })}
            </p>
          </div>

          <p className="font-extrabold text-ink-soft text-sm mb-2 mt-6">{t({ en: "When?", ur: "کب؟" })}</p>
          <div className="flex flex-wrap gap-2">
            {WHEN.map((w) => (
              <Chip key={w.id} active={when === w.id} onClick={() => setWhen(w.id)}>
                {t(w.label)}
              </Chip>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return <Offers trade={trade} offer={offer} onEdit={() => setSent(false)} onAccept={onAccept} />;
}

function Offers({ trade, offer, onEdit, onAccept }: { trade: Trade; offer: number; onEdit: () => void; onAccept: (w: WorkerOffer, price: number) => void }) {
  const { t, money } = useLang();
  // the trade you asked for comes first, then the nearest others
  const pool = [...WORKERS].sort((a, b) => (a.trade === trade ? 0 : 1) - (b.trade === trade ? 0 : 1) || a.km - b.km).slice(0, 4);
  const [count, setCount] = useState(0);
  const [declined, setDeclined] = useState<string[]>([]);

  useEffect(() => {
    if (count >= pool.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), count === 0 ? 1500 : 1300);
    return () => clearTimeout(id);
  }, [count, pool.length]);

  const visible = pool.slice(0, count).filter((w) => !declined.includes(w.id));
  const area = t(AREAS[0].label);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-ink text-white p-4 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          {count < pool.length && <span className="absolute inline-flex h-full w-full rounded-full bg-sun opacity-75 animate-ping" />}
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sun" />
        </span>
        <p className="font-bold flex-1">
          {count < pool.length
            ? t({ en: `Sending your offer to kaarigars near ${area}…`, ur: `${area} کے قریب کاریگروں کو آپ کی پیشکش بھیجی جا رہی ہے…` })
            : t({ en: `${visible.length} replies. Pick the one you like.`, ur: `${visible.length} جواب آئے۔ جو پسند ہو چنیں۔` })}
        </p>
        <span className="font-black latin">{money(offer)}</span>
        <button type="button" onClick={onEdit} className="rounded-full bg-white/10 hover:bg-white/20 p-2" aria-label={t({ en: "Change my offer", ur: "پیشکش بدلیں" })}>
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <NeighbourhoodMap
        pins={pool.slice(0, count).filter((w) => !declined.includes(w.id)).map((w) => ({ id: w.id, x: w.pin.x, y: w.pin.y, label: w.initials, color: TONE_COLOR[w.tone] }))}
        homeLabel={t({ en: "You", ur: "آپ" })}
        areaLabel={area}
      />

      <div className="flex items-center gap-2">
        <DemoTag />
        <span className="text-xs font-bold text-ink-soft">{t({ en: "Sample kaarigar profiles for the prototype", ur: "پروٹوٹائپ کے لیے نمونہ کاریگر پروفائل" })}</span>
      </div>

      <div className="space-y-3">
        {visible.map((w) => {
          const price = offer + w.extra;
          return (
            <div key={w.id} className="rounded-3xl bg-white border-2 border-line p-4 pop-in">
              <div className="flex items-center gap-3">
                <span className={`h-14 w-14 shrink-0 rounded-full ${w.tone} text-white text-lg font-black grid place-items-center border-2 border-ink latin`}>{w.initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-ink text-lg flex items-center gap-1.5">
                    {t(w.name)} <BadgeCheck className="h-4 w-4 text-sky" />
                  </p>
                  <p className="text-sm text-ink-soft font-bold flex flex-wrap items-center gap-x-3">
                    <span>{t(tradeLabel(w.trade))}</span>
                    <span className="inline-flex items-center gap-1 latin">
                      <Star className="h-3.5 w-3.5 fill-sun text-sun" /> {w.rating} ({w.jobs})
                    </span>
                    <span>
                      {w.years} {t({ en: "yrs", ur: "سال" })}
                    </span>
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className={`text-xl font-black latin ${w.extra ? "text-amber" : "text-ink"}`}>{money(price)}</p>
                  <p className="text-xs font-bold text-ink-soft inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {w.eta} {t({ en: "min", ur: "منٹ" })} · <span className="latin">{w.km} km</span>
                  </p>
                </div>
              </div>
              {w.extra > 0 && (
                <p className="mt-2 text-sm font-bold text-[#8a5a00] bg-amber-soft rounded-xl px-3 py-1.5">
                  {t({ en: `Asks ${money(w.extra)} more than your offer`, ur: `آپ کی پیشکش سے ${money(w.extra)} زیادہ مانگ رہے ہیں` })}
                </p>
              )}
              <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={() => setDeclined((d) => [...d, w.id])}
                  className="h-12 px-5 rounded-2xl bg-sand hover:bg-line font-extrabold text-ink-soft inline-flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" /> {t({ en: "No thanks", ur: "نہیں شکریہ" })}
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(w, price)}
                  className="h-12 rounded-2xl bg-leaf hover:brightness-95 text-white font-black text-lg"
                >
                  {t({ en: `Accept ${money(price)}`, ur: `${money(price)} قبول کریں` })}
                </button>
              </div>
            </div>
          );
        })}
        {count >= pool.length && visible.length === 0 && (
          <Card className="text-center">
            <p className="font-bold text-ink">{t({ en: "No more replies. Try changing your offer.", ur: "مزید جواب نہیں۔ اپنی پیشکش بدل کر دیکھیں۔" })}</p>
            <button type="button" onClick={onEdit} className="mt-3 rounded-full border-2 border-ink px-5 py-2 font-extrabold inline-flex items-center gap-2">
              <Send className="h-4 w-4" /> {t({ en: "Change my offer", ur: "پیشکش بدلیں" })}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
