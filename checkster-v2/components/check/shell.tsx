"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Camera, Check, HardHat, MessagesSquare, Receipt, RotateCcw, ScanSearch } from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { LangToggle, Logo, Mascot } from "@/components/site/brand";

const NODES: { icon: typeof Camera; label: Tx }[] = [
  { icon: Camera, label: { en: "Photo", ur: "تصویر" } },
  { icon: ScanSearch, label: { en: "Checkup", ur: "معائنہ" } },
  { icon: MessagesSquare, label: { en: "Experts", ur: "ماہرین" } },
  { icon: Receipt, label: { en: "Price", ur: "قیمت" } },
  { icon: HardHat, label: { en: "Kaarigar", ur: "کاریگر" } },
];

/** Picture progress bar: you always see where you are and what comes next. */
function Progress({ step }: { step: number }) {
  const { t } = useLang();
  return (
    <ol className="flex items-start justify-between gap-1">
      {NODES.map((n, i) => {
        const done = step > i;
        const now = step === i;
        const Icon = done ? Check : n.icon;
        return (
          <li key={i} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <span
                className={`absolute top-5 end-1/2 w-full h-1 -z-0 rounded ${step >= i ? "bg-leaf" : "bg-line"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 h-10 w-10 rounded-full grid place-items-center border-2 transition-colors ${
                done ? "bg-leaf border-leaf text-white" : now ? "bg-brand border-ink text-white scale-110" : "bg-white border-line text-ink-soft"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className={`mt-1.5 text-[11px] sm:text-xs font-extrabold ${now ? "text-ink" : "text-ink-soft"}`}>{t(n.label)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function CheckShell({
  step,
  guide,
  mood = "happy",
  onRestart,
  children,
  actions,
}: {
  step: number;
  guide: Tx;
  mood?: "happy" | "think" | "wink";
  onRestart: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-line no-print">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <Logo />
          <div className="ms-auto flex items-center gap-2">
            <LangToggle />
            <button
              type="button"
              onClick={onRestart}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:text-ink hover:bg-sand"
            >
              <RotateCcw className="h-4 w-4" />
              {t({ en: "Start again", ur: "دوبارہ شروع کریں" })}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pt-5 pb-36">
        <div className="no-print">
          <Progress step={step} />
          {/* the mascot always says, in one line, what to do on this screen */}
          <div className="mt-5 flex items-end gap-3" aria-live="polite">
            <Mascot size={52} mood={mood} className="shrink-0" />
            <div className="relative rounded-2xl rounded-bl-md rtl:rounded-bl-2xl rtl:rounded-br-md bg-white border-2 border-ink px-4 py-3 font-bold text-ink text-[15px] sm:text-base leading-snug">
              {t(guide)}
            </div>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </main>

      {actions && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-line no-print">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">{actions}</div>
        </div>
      )}
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-14 px-4 rounded-2xl font-extrabold text-ink-soft hover:text-ink hover:bg-sand inline-flex items-center gap-1.5 shrink-0"
    >
      <ArrowLeft className="h-5 w-5 flip-rtl" />
      <span className="hidden sm:inline">{t({ en: "Back", ur: "پیچھے" })}</span>
    </button>
  );
}

export function PrimaryButton({ children, onClick, tone = "brand" }: { children: ReactNode; onClick: () => void; tone?: "brand" | "leaf" | "sky" }) {
  const bg = tone === "leaf" ? "bg-leaf hover:brightness-95" : tone === "sky" ? "bg-sky hover:bg-sky-dark" : "bg-brand hover:bg-brand-dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-14 rounded-2xl ${bg} text-white text-lg font-black inline-flex items-center justify-center gap-2 transition-colors shadow-[0_4px_0_0_var(--ink)] active:translate-y-0.5 active:shadow-[0_2px_0_0_var(--ink)]`}
    >
      {children}
    </button>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="flex-1 text-center font-bold text-ink-soft">{children}</p>;
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-2 px-4 py-2 font-bold text-[15px] transition-colors ${
        active ? "bg-ink border-ink text-white" : "bg-white border-line text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white border border-line p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function CardTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-ink ur-tight">{children}</h2>
      {sub && <p className="mt-1 text-ink-soft">{sub}</p>}
    </div>
  );
}
