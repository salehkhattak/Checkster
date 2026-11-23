"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FastForward } from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  ANSWER_LABEL,
  CHAT_OPENING,
  EXPERTS,
  QUESTIONS,
  REPAIR_STEPS,
  SAFETY_NOTE,
  likelyCause,
  tradeLabel,
  type Answer,
  type ChatLine,
  type Speaker,
  type Trade,
} from "@/lib/data";
import { DemoTag, Mascot } from "@/components/site/brand";
import { TradePicture } from "@/components/site/illustrations";

export type Answers = { bathroom: Answer | null; rain: Answer | null };

type Item = { kind: "msg"; line: ChatLine } | { kind: "q"; id: "bathroom" | "rain" } | { kind: "final" };

const NAME_COLOR: Record<Exclude<Speaker, "checkster">, string> = {
  plumber: "text-sky-dark",
  mason: "text-brand-dark",
  waterproofing: "text-[#0f6b43]",
};

const AVATAR_BG: Record<Exclude<Speaker, "checkster">, string> = {
  plumber: "var(--sky-soft)",
  mason: "var(--brand-soft)",
  waterproofing: "var(--leaf-soft)",
};

function Avatar({ who }: { who: Speaker }) {
  if (who === "checkster") return <Mascot size={40} />;
  return <TradePicture trade={who as Trade} size={40} bg={AVATAR_BG[who as Exclude<Speaker, "checkster">]} />;
}

export function StepExperts({
  answers,
  setAnswer,
  onFinished,
}: {
  answers: Answers;
  setAnswer: (id: "bathroom" | "rain", a: Answer) => void;
  onFinished: (done: boolean) => void;
}) {
  const { t } = useLang();
  const [pos, setPos] = useState(0);
  const [fast, setFast] = useState(answers.bathroom !== null && answers.rain !== null);
  const endRef = useRef<HTMLDivElement>(null);

  const bothAnswered = answers.bathroom !== null && answers.rain !== null;
  const cause = likelyCause(answers.bathroom, answers.rain);

  // The conversation, in order. Replies depend on the user's answers.
  const script: Item[] = useMemo(() => {
    const s: Item[] = CHAT_OPENING.map((line) => ({ kind: "msg" as const, line }));
    s.push({ kind: "q", id: "bathroom" }, { kind: "q", id: "rain" });
    if (bothAnswered) {
      cause.reply.forEach((line) => s.push({ kind: "msg", line }));
      s.push({ kind: "final" });
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothAnswered, cause.key]);

  const current = script[pos];
  const finished = pos >= script.length && bothAnswered;

  useEffect(() => {
    onFinished(finished);
  }, [finished, onFinished]);

  useEffect(() => {
    if (!current) return;
    if (current.kind === "q") {
      if (answers[current.id] !== null) setPos((p) => p + 1);
      return; // wait for a tap
    }
    const id = setTimeout(() => setPos((p) => p + 1), fast ? 80 : current.kind === "final" ? 700 : 1300);
    return () => clearTimeout(id);
  }, [current, answers, fast]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pos]);

  const shown = script.slice(0, pos);
  const typingWho = current && current.kind === "msg" ? current.line.who : null;

  return (
    <div className="rounded-3xl border-2 border-ink overflow-hidden bg-white">
      {/* chat header, like a WhatsApp group */}
      <div className="bg-ink text-white px-4 py-3 flex items-center gap-3">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {(["plumber", "mason", "waterproofing"] as Trade[]).map((tr) => (
            <span key={tr} className="rounded-full ring-2 ring-ink bg-white">
              <TradePicture trade={tr} size={32} bg="#fff" />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="font-black leading-tight">{t({ en: "Checkster experts", ur: "چیکسٹر ماہرین" })}</p>
          <p className="text-xs text-white/70">
            {typingWho
              ? `${typingWho === "checkster" ? "Checkster" : t(EXPERTS[typingWho].name)} ${t({ en: "is typing…", ur: "لکھ رہے ہیں…" })}`
              : t({ en: "Plumber, mistri, waterproofing", ur: "پلمبر، مستری، واٹر پروفنگ" })}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <DemoTag />
          {!finished && (
            <button
              type="button"
              onClick={() => setFast(true)}
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-bold"
            >
              <FastForward className="h-3.5 w-3.5" />
              {t({ en: "Faster", ur: "جلدی" })}
            </button>
          )}
        </div>
      </div>

      <div className="bg-sand/60 p-3 sm:p-5 space-y-3 min-h-[24rem]">
        {shown.map((it, i) => {
          if (it.kind === "msg") return <Bubble key={i} line={it.line} />;
          if (it.kind === "q") {
            const a = answers[it.id];
            return (
              <div key={i} className="space-y-2">
                <Bubble line={{ who: "checkster", text: QUESTIONS.find((q) => q.id === it.id)!.text }} />
                {a && (
                  <div className="flex justify-end">
                    <span className="rounded-2xl rounded-br-md rtl:rounded-br-2xl rtl:rounded-bl-md bg-brand text-white font-extrabold px-4 py-2 rise-in">
                      {t(ANSWER_LABEL[a])}
                    </span>
                  </div>
                )}
              </div>
            );
          }
          return <FinalCard key={i} causeTitle={t(cause.title)} first={t(cause.firstStep)} confidence={t(cause.confidence)} trade={cause.trade} />;
        })}

        {/* waiting for a tap */}
        {current && current.kind === "q" && answers[current.id] === null && (
          <div className="space-y-2">
            <Bubble line={{ who: "checkster", text: QUESTIONS.find((q) => q.id === current.id)!.text }} />
            <div className="ps-11 grid grid-cols-3 gap-2 max-w-md rise-in">
              {(["yes", "no", "unsure"] as Answer[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAnswer(current.id, a)}
                  className="h-14 rounded-2xl border-2 border-ink bg-white hover:bg-sun font-black text-lg text-ink shadow-[0_3px_0_0_var(--ink)] active:translate-y-0.5"
                >
                  {t(ANSWER_LABEL[a])}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* typing dots */}
        {typingWho && (
          <div className="flex items-end gap-2">
            <Avatar who={typingWho} />
            <span className="rounded-2xl bg-white px-4 py-3 inline-flex gap-1">
              <span className="typing-dot h-2 w-2 rounded-full bg-ink-soft" />
              <span className="typing-dot h-2 w-2 rounded-full bg-ink-soft" />
              <span className="typing-dot h-2 w-2 rounded-full bg-ink-soft" />
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function Bubble({ line }: { line: ChatLine }) {
  const { t } = useLang();
  const isBot = line.who === "checkster";
  return (
    <div className="flex items-end gap-2 rise-in">
      <span className="shrink-0">
        <Avatar who={line.who} />
      </span>
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-md rtl:rounded-bl-2xl rtl:rounded-br-md px-4 py-2.5 ${
          isBot ? "bg-sun-soft border border-sun" : "bg-white border border-line"
        }`}
      >
        <p className={`text-xs font-black ${isBot ? "text-ink" : NAME_COLOR[line.who as Exclude<Speaker, "checkster">]}`}>
          {isBot ? "Checkster" : t(EXPERTS[line.who as Exclude<Speaker, "checkster">].name)}
        </p>
        <p className="text-ink font-semibold leading-snug mt-0.5">{t(line.text)}</p>
      </div>
    </div>
  );
}

function FinalCard({ causeTitle, first, confidence, trade }: { causeTitle: string; first: string; confidence: string; trade: Trade }) {
  const { t } = useLang();
  return (
    <div className="rounded-3xl bg-white border-2 border-ink p-5 pop-in">
      <div className="flex items-center gap-2 flex-wrap">
        <CheckCircle2 className="h-6 w-6 text-leaf" />
        <p className="font-black text-ink text-lg">{t({ en: "Final decision", ur: "آخری فیصلہ" })}</p>
        <span className="rounded-full bg-sky-soft text-sky-dark text-xs font-extrabold px-2.5 py-0.5">{confidence}</span>
      </div>
      <p className="mt-3 text-sm font-extrabold text-ink-soft">{t({ en: "Most likely cause", ur: "سب سے زیادہ ممکنہ وجہ" })}</p>
      <p className="text-2xl font-black text-ink leading-tight ur-tight">{causeTitle}</p>

      <div className="mt-4 rounded-2xl bg-leaf-soft p-4 flex gap-3 items-start">
        <TradePicture trade={trade} size={44} bg="#fff" />
        <div>
          <p className="text-sm font-extrabold text-[#0f6b43]">
            {t({ en: "Do this first", ur: "پہلے یہ کریں" })} · {t(tradeLabel(trade))}
          </p>
          <p className="font-bold text-ink">{first}</p>
        </div>
      </div>

      <p className="mt-5 text-sm font-extrabold text-ink-soft">{t({ en: "The right order of repair", ur: "مرمت کی صحیح ترتیب" })}</p>
      <ol className="mt-2 space-y-2">
        {REPAIR_STEPS.map((s, i) => (
          <li key={s.en} className="flex gap-3 items-start">
            <span className="h-6 w-6 shrink-0 rounded-full bg-ink text-white text-xs font-black grid place-items-center latin">{i + 1}</span>
            <span className="font-semibold text-ink">{t(s)}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-2xl bg-danger-soft p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-ink">{t(SAFETY_NOTE)}</p>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        {t({
          en: "This is a first opinion from a sample AI discussion, not a certified inspection. A kaarigar should confirm it on site.",
          ur: "یہ نمونہ اے آئی گفتگو کی پہلی رائے ہے، سرٹیفائیڈ معائنہ نہیں۔ کاریگر موقع پر اس کی تصدیق کرے۔",
        })}
      </p>
    </div>
  );
}
