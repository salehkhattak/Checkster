"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Send } from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { PROBLEMS, likelyCause, type Answer, type LineItem, type ProblemId, type Trade, type WorkerOffer } from "@/lib/data";
import type { Finding } from "@/lib/audit";
import { takePendingPhoto } from "@/lib/handoff";
import { BackButton, CheckShell, Hint, PrimaryButton } from "./shell";
import { StepPhoto, type Intake } from "./step-photo";
import { StepScan } from "./step-scan";
import { StepExperts, type Answers } from "./step-experts";
import { StepPrice, type QuoteMode } from "./step-price";
import { StepWorkers, SUGGESTED, type WhenId } from "./step-workers";
import { StepBooked } from "./step-booked";

const GUIDE: Tx[] = [
  { en: "Take a photo of the problem. No photo? Use our sample photo.", ur: "مسئلے کی تصویر لیں۔ تصویر نہیں؟ ہماری نمونے کی تصویر لیں۔" },
  { en: "Hold on, I'm looking closely at your photo…", ur: "ذرا رکیں، میں آپ کی تصویر غور سے دیکھ رہا ہوں…" },
  { en: "3 experts are talking about your wall. Answer their 2 questions by tapping.", ur: "تین ماہرین آپ کی دیوار پر بات کر رہے ہیں۔ ان کے دو سوالوں کا جواب ٹیپ کر کے دیں۔" },
  { en: "Do you already have a price from a contractor? Choose one.", ur: "کیا آپ کے پاس ٹھیکیدار کی قیمت پہلے سے ہے؟ ایک چنیں۔" },
  { en: "Set your price and send it. Nearby kaarigars will reply.", ur: "اپنی قیمت لگائیں اور بھیجیں۔ قریبی کاریگر جواب دیں گے۔" },
  { en: "Done! Everything is saved in your report below.", ur: "ہو گیا! سب کچھ نیچے آپ کی رپورٹ میں ہے۔" },
];

const FRESH_INTAKE: Intake = { problem: "damp", photo: null, usingSample: false, desc: "", room: "bedroom", city: "peshawar", area: 40 };

export function CheckFlow() {
  const { t } = useLang();
  const params = useSearchParams();

  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<Intake>(FRESH_INTAKE);
  const [scanDone, setScanDone] = useState(false);
  const [answers, setAnswers] = useState<Answers>({ bathroom: null, rain: null });
  const [chatDone, setChatDone] = useState(false);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [statedTotal, setStatedTotal] = useState<number | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [trade, setTrade] = useState<Trade>("plumber");
  const [offer, setOffer] = useState(SUGGESTED.plumber);
  const [when, setWhen] = useState<WhenId>("today");
  const [sent, setSent] = useState(false);
  const [booked, setBooked] = useState<{ worker: WorkerOffer; price: number } | null>(null);
  const [hint, setHint] = useState(false);

  // Read what the home page passed in (problem, description, city, photo, sample)
  useEffect(() => {
    const problem = params.get("problem") as ProblemId | null;
    const patch: Partial<Intake> = {};
    if (problem && PROBLEMS.some((p) => p.id === problem)) patch.problem = problem;
    const desc = params.get("desc");
    if (desc) patch.desc = desc;
    const city = params.get("city");
    if (city) patch.city = city;
    const photo = takePendingPhoto();
    if (photo) patch.photo = photo;
    if (params.get("sample") === "1") {
      patch.usingSample = true;
      patch.desc = t({ en: "Bedroom ki deewar neeche se geeli hai aur rang utar raha hai", ur: "بیڈروم کی دیوار نیچے سے گیلی ہے اور رنگ اتر رہا ہے" });
    }
    setIntake((i) => ({ ...i, ...patch }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setHint(false);
  }, [step]);

  const cause = likelyCause(answers.bathroom, answers.rain);

  const setAnswer = useCallback((id: "bathroom" | "rain", a: Answer) => setAnswers((s) => ({ ...s, [id]: a })), []);
  const setIntakePart = useCallback((p: Partial<Intake>) => setIntake((i) => ({ ...i, ...p })), []);

  const restart = () => {
    if (intake.photo) URL.revokeObjectURL(intake.photo);
    setIntake(FRESH_INTAKE);
    setScanDone(false);
    setAnswers({ bathroom: null, rain: null });
    setChatDone(false);
    setQuoteMode(null);
    setItems([]);
    setStatedTotal(null);
    setFindings(null);
    setSent(false);
    setBooked(null);
    setStep(0);
  };

  const back = () => {
    if (step === 4 && sent) return setSent(false);
    setStep((s) => Math.max(0, s - 1));
  };

  // ---------- one big button per screen ----------
  let actions: ReactNode = null;
  const problemReady = PROBLEMS.find((p) => p.id === intake.problem)!.ready;

  if (step === 0) {
    actions = problemReady ? (
      <PrimaryButton
        onClick={() => {
          if (!intake.photo) setIntake((i) => ({ ...i, usingSample: true }));
          setScanDone(false);
          setStep(1);
        }}
      >
        {intake.photo || intake.usingSample ? t({ en: "Check my wall", ur: "میری دیوار چیک کریں" }) : t({ en: "Continue with sample photo", ur: "نمونے کی تصویر سے جاری رکھیں" })}
        <ArrowRight className="h-5 w-5 flip-rtl" />
      </PrimaryButton>
    ) : (
      <PrimaryButton onClick={() => setIntakePart({ problem: "damp" })}>{t({ en: "Try the seelan check instead", ur: "اس کی بجائے سیلن چیک آزمائیں" })}</PrimaryButton>
    );
  } else if (step === 1) {
    actions = (
      <>
        <BackButton onClick={back} />
        <PrimaryButton onClick={() => setStep(2)}>
          {scanDone ? t({ en: "See what the experts say", ur: "دیکھیں ماہرین کیا کہتے ہیں" }) : t({ en: "Skip waiting", ur: "انتظار چھوڑیں" })}
          <ArrowRight className="h-5 w-5 flip-rtl" />
        </PrimaryButton>
      </>
    );
  } else if (step === 2) {
    actions = (
      <>
        <BackButton onClick={back} />
        {chatDone ? (
          <PrimaryButton
            onClick={() => {
              setTrade(cause.trade);
              setOffer(SUGGESTED[cause.trade]);
              setStep(3);
            }}
          >
            {t({ en: "Next: check the price", ur: "اگلا: قیمت چیک کریں" })}
            <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        ) : (
          <Hint>{t({ en: "Answer the 2 questions in the chat", ur: "چیٹ میں دو سوالوں کے جواب دیں" })}</Hint>
        )}
      </>
    );
  } else if (step === 3) {
    actions = (
      <>
        <BackButton onClick={back} />
        {quoteMode ? (
          <PrimaryButton onClick={() => setStep(4)}>
            {t({ en: "Next: find a kaarigar", ur: "اگلا: کاریگر ڈھونڈیں" })}
            <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        ) : (
          <Hint>{hint ? t({ en: "Tap one of the two boxes above", ur: "اوپر دو میں سے ایک خانے پر ٹیپ کریں" }) : t({ en: "Choose one option above", ur: "اوپر ایک آپشن چنیں" })}</Hint>
        )}
      </>
    );
  } else if (step === 4) {
    actions = (
      <>
        <BackButton onClick={back} />
        {sent ? (
          <Hint>{t({ en: "Tap Accept on the offer you like", ur: "جو پیشکش پسند ہو اس پر قبول کریں دبائیں" })}</Hint>
        ) : (
          <PrimaryButton onClick={() => setSent(true)}>
            <Send className="h-5 w-5 flip-rtl" />
            {t({ en: "Send to nearby kaarigars", ur: "قریبی کاریگروں کو بھیجیں" })}
          </PrimaryButton>
        )}
      </>
    );
  } else if (step === 5) {
    actions = <PrimaryButton onClick={restart}>{t({ en: "Start a new check", ur: "نیا چیک شروع کریں" })}</PrimaryButton>;
  }

  return (
    <CheckShell step={step} guide={GUIDE[step]} mood={step === 1 ? "think" : step === 5 ? "wink" : "happy"} onRestart={restart} actions={actions}>
      {step === 0 && <StepPhoto intake={intake} set={setIntakePart} />}
      {step === 1 && <StepScan photo={intake.photo} onDone={setScanDone} />}
      {step === 2 && <StepExperts answers={answers} setAnswer={setAnswer} onFinished={setChatDone} />}
      {step === 3 && (
        <StepPrice
          cause={cause}
          area={intake.area}
          mode={quoteMode}
          setMode={setQuoteMode}
          items={items}
          setItems={setItems}
          statedTotal={statedTotal}
          setStatedTotal={setStatedTotal}
          findings={findings}
          setFindings={setFindings}
        />
      )}
      {step === 4 && (
        <StepWorkers
          trade={trade}
          setTrade={setTrade}
          offer={offer}
          setOffer={setOffer}
          when={when}
          setWhen={setWhen}
          sent={sent}
          setSent={setSent}
          onAccept={(worker, price) => {
            setBooked({ worker, price });
            setStep(5);
          }}
        />
      )}
      {step === 5 && booked && <StepBooked worker={booked.worker} price={booked.price} cause={cause} problem={intake.problem} />}
    </CheckShell>
  );
}
