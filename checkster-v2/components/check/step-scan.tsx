"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { OBSERVATIONS } from "@/lib/data";
import { DemoTag } from "@/components/site/brand";
import { Card } from "./shell";
import { PhotoView } from "./wall";

/** Live checkup: the photo is scanned and each finding appears one by one. */
export function StepScan({ photo, onDone }: { photo: string | null; onDone: (done: boolean) => void }) {
  const { t } = useLang();
  const [found, setFound] = useState(0);
  const done = found >= OBSERVATIONS.length;

  useEffect(() => {
    if (done) {
      onDone(true);
      return;
    }
    const id = setTimeout(() => setFound((f) => f + 1), found === 0 ? 1400 : 1100);
    return () => clearTimeout(id);
  }, [found, done, onDone]);

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
      <PhotoView src={photo} boxes={found} scanning={!done} />
      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-black text-ink ur-tight">
            {done ? t({ en: "What we noticed", ur: "ہم نے کیا دیکھا" }) : t({ en: "Looking closely…", ur: "غور سے دیکھ رہے ہیں…" })}
          </h2>
          <DemoTag />
        </div>
        <ol className="mt-4 space-y-3">
          {OBSERVATIONS.map((o, i) => {
            const seen = i < found;
            const now = i === found;
            return (
              <li key={o.id} className={`flex items-start gap-3 transition-opacity ${seen || now ? "opacity-100" : "opacity-35"}`}>
                <span
                  className={`h-8 w-8 shrink-0 rounded-full grid place-items-center border-2 font-black text-sm latin ${
                    seen ? "bg-sun border-ink text-ink" : "bg-white border-line text-ink-soft"
                  }`}
                >
                  {seen ? i + 1 : now ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                </span>
                <span className="pt-1 font-bold text-ink">{seen ? t(o.text) : t({ en: "Checking…", ur: "چیک ہو رہا ہے…" })}</span>
              </li>
            );
          })}
        </ol>
        {done && (
          <div className="mt-5 rounded-2xl bg-amber-soft p-4 rise-in">
            <p className="text-sm font-extrabold text-[#8a5a00]">{t({ en: "How serious?", ur: "کتنا سنگین؟" })}</p>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`h-3 flex-1 rounded-full ${n <= 3 ? "bg-amber" : "bg-white"}`} />
              ))}
            </div>
            <p className="mt-2 font-bold text-ink">
              {t({ en: "Needs attention soon. Not an emergency.", ur: "جلد توجہ چاہیے۔ ایمرجنسی نہیں۔" })}
            </p>
          </div>
        )}
        {done && (
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-leaf">
            <Check className="h-4 w-4" />
            {t({ en: "Photo checked. Now let's ask the experts.", ur: "تصویر چیک ہو گئی۔ اب ماہرین سے پوچھتے ہیں۔" })}
          </p>
        )}
      </Card>
    </div>
  );
}
