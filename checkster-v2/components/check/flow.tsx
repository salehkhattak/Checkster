"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, FileCheck, Send } from "lucide-react";
import { useLang, type Tx } from "@/lib/i18n";
import { PROBLEMS, likelyCause, type Answer, type LineItem, type ProblemId, type Trade, type WorkerOffer } from "@/lib/data";
import type { Finding } from "@/lib/audit";
import { takePendingPhoto } from "@/lib/handoff";
import {
  api,
  createSampleDampWallFile,
  fileFromObjectUrl,
  type AuditExplanation,
  type Diagnosis,
  type Estimate,
  type Inspection,
} from "@/lib/api";
import { BackButton, CheckShell, Hint, PrimaryButton } from "./shell";
import { StepPhoto, type Intake } from "./step-photo";
import { StepScan } from "./step-scan";
import { StepExperts, type Answers } from "./step-experts";
import { StepPrice, type QuoteMode } from "./step-price";
import { StepWorkers, SUGGESTED, type WhenId } from "./step-workers";
import { StepBooked } from "./step-booked";

const GUIDE: Tx[] = [
  {
    en: "Upload a photo of the home problem, select the area, and describe it in English, Urdu, or Roman Urdu.",
    ur: "مسئلے کی تصویر لگائیں اور اردو، رومن اردو یا انگریزی میں تفصیل بتائیں۔",
  },
  {
    en: "Gemini Vision is analysing visible evidence, severity, and possible causes in your photograph…",
    ur: "جیمنائی وژن آپ کی تصویر میں نظر آنے والے شواہد کا تجزیہ کر رہا ہے…",
  },
  {
    en: "Answer the follow-up questions so our specialist coordinator can produce a grounded diagnosis.",
    ur: "ماہرین کے سوالات کے جواب دیں تاکہ حتمی تشخیص اور مرمت کا منصوبہ تیار ہو سکے۔",
  },
  {
    en: "View source-backed local cost estimates or upload a contractor quotation (PDF/Image) for OCR & deterministic audit.",
    ur: "سرکاری ریٹ سے تخمینی لاگت دیکھیں یا ٹھیکیدار کا تخمینہ اپ لوڈ کر کے آڈٹ کریں۔",
  },
  {
    en: "Discover Checkster-registered contractors & Google Maps listings, or broadcast your offer.",
    ur: "قریبی کاریگر تلاش کریں یا اپنی قیمت کی پیشکش بھیجیں۔",
  },
  {
    en: "Your complete Inspection & Quotation Audit Report is ready to print, save as PDF, or share on WhatsApp.",
    ur: "آپ کی مکمل معائنہ اور تخمینہ آڈٹ رپورٹ تیار ہے۔",
  },
];

const SESSION_INSP_KEY = "checkster-active-inspection-id";

const FRESH_INTAKE: Intake = {
  problem: "damp",
  photo: null,
  photos: [],
  files: [],
  usingSample: false,
  desc: "",
  room: "bedroom",
  city: "peshawar",
  neighbourhood: "Hayatabad",
  area: 40,
  consent: true,
};

export function CheckFlow() {
  const { t, lang } = useLang();
  const params = useSearchParams();

  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<Intake>(FRESH_INTAKE);
  const intakeRef = useRef<Intake>(FRESH_INTAKE);
  intakeRef.current = intake;
  const [inspectionId, setInspectionId] = useState<string>("");
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");

  const [answers, setAnswers] = useState<Answers>({});
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState("");

  const [quoteMode, setQuoteMode] = useState<QuoteMode>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [statedTotal, setStatedTotal] = useState<number | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [contractorName, setContractorName] = useState("");
  const [aiExplanation, setAiExplanation] = useState<AuditExplanation | null>(null);

  const [trade, setTrade] = useState<Trade>("plumber");
  const [offer, setOffer] = useState(SUGGESTED.plumber);
  const [when, setWhen] = useState<WhenId>("today");
  const [sent, setSent] = useState(false);
  const [booked, setBooked] = useState<{ worker: WorkerOffer | null; price: number } | null>(null);

  // Resume a saved inspection by ?id=... or from sessionStorage on refresh
  const loadSavedInspection = useCallback(async (id: string) => {
    try {
      const rec = await api.getInspection(id);
      setInspectionId(rec.id);
      setIntake((prev) => ({
        ...prev,
        city: rec.city || prev.city,
        neighbourhood: rec.neighbourhood || prev.neighbourhood,
        room: rec.room || prev.room,
        area: rec.area_sqft || prev.area,
        desc: rec.description || prev.desc,
        photo: rec.image_urls?.[0] || prev.photo,
        photos: rec.image_urls || prev.photos,
      }));
      if (rec.initial_analysis && Object.keys(rec.initial_analysis).length > 0) {
        setInspection({ ...rec.initial_analysis, inspection_id: rec.id, image_urls: rec.image_urls });
      }
      if (rec.followup_answers) setAnswers(rec.followup_answers);
      if (rec.diagnosis_data && Object.keys(rec.diagnosis_data).length > 0) {
        setDiagnosis(rec.diagnosis_data);
        if (rec.diagnosis_data.primary_trade) {
          setTrade(rec.diagnosis_data.primary_trade);
          setOffer(SUGGESTED[rec.diagnosis_data.primary_trade] || 4500);
        }
      }
      if (rec.estimate_data && Object.keys(rec.estimate_data).length > 0) {
        setEstimate(rec.estimate_data);
      }
      if (rec.quotations && rec.quotations.length > 0) {
        const q = rec.quotations[0];
        setQuoteMode("have");
        setContractorName(q.contractor_name || "");
        setStatedTotal(q.quoted_total);
        if (q.line_items?.length) {
          setItems(
            q.line_items.map((li, i) => ({
              id: `saved_${i}`,
              work: li.description,
              quantity: li.quantity,
              unit: li.unit,
              amount: li.total_price || 0,
            })),
          );
        }
        if (q.findings?.length) {
          setFindings(
            q.findings.map((f) => ({
              id: f.id,
              severity: f.severity,
              title: f.title,
              item: f.item,
              explain: f.explain,
              ask: f.ask,
            })),
          );
        }
        if (q.ai_explanation && Object.keys(q.ai_explanation).length > 0) {
          setAiExplanation(q.ai_explanation);
        }
      }
      // Jump to appropriate stage
      if (rec.status === "quote_audited" || rec.status === "repair_requested" || rec.status === "completed") {
        setBooked({ worker: null, price: rec.estimate_data?.total_low || 4500 });
        setStep(5);
      } else if (rec.status === "diagnosis_ready" || rec.status === "quote_uploaded") {
        setStep(3);
      } else if (rec.status === "awaiting_answers") {
        setStep(2);
      }
    } catch {
      /* ignore if not found */
    }
  }, []);

  useEffect(() => {
    const idParam = params.get("id");
    if (idParam) {
      loadSavedInspection(idParam);
      return;
    }
    const problem = params.get("problem") as ProblemId | null;
    const patch: Partial<Intake> = {};
    if (problem && PROBLEMS.some((p) => p.id === problem)) patch.problem = problem;
    const desc = params.get("desc");
    if (desc) patch.desc = desc;
    const city = params.get("city");
    if (city) patch.city = city;
    const photo = takePendingPhoto();
    if (photo) {
      patch.photo = photo;
      patch.photos = [photo];
    }
    if (params.get("sample") === "1") {
      patch.usingSample = true;
      patch.desc = t({
        en: "Bedroom ki deewar neeche se geeli hai aur rang utar raha hai",
        ur: "بیڈروم کی دیوار نیچے سے گیلی ہے اور رنگ اتر رہا ہے",
      });
    }
    setIntake((i) => ({ ...i, ...patch }));

    // Check sessionStorage for an active inspection if no new params were passed
    if (!problem && !desc && !photo && params.get("sample") !== "1") {
      try {
        const savedId = window.sessionStorage.getItem(SESSION_INSP_KEY);
        if (savedId) loadSavedInspection(savedId);
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const runVisualInspection = useCallback(async () => {
    const currentIntake = intakeRef.current;
    setScanLoading(true);
    setScanError("");
    try {
      let uploadFiles = [...currentIntake.files];
      if (uploadFiles.length === 0 && currentIntake.photo) {
        try {
          uploadFiles = [await fileFromObjectUrl(currentIntake.photo)];
        } catch {
          uploadFiles = [];
        }
      }
      if (uploadFiles.length === 0) {
        uploadFiles = [await createSampleDampWallFile()];
      }
      const res = await api.inspect(uploadFiles, {
        category: currentIntake.problem,
        description: currentIntake.desc,
        room: currentIntake.room,
        city: currentIntake.city,
        neighbourhood: currentIntake.neighbourhood,
        area_sqft: currentIntake.area,
        language: lang,
        inspection_id: inspectionId || undefined,
      });
      setInspection(res);
      if (res.inspection_id) {
        setInspectionId(res.inspection_id);
        try {
          window.sessionStorage.setItem(SESSION_INSP_KEY, res.inspection_id);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      setScanError((err as Error).message || "AI visual inspection failed.");
    } finally {
      setScanLoading(false);
    }
  }, [lang, inspectionId]);

  const runSpecialistRefine = useCallback(async () => {
    if (!inspection) return;
    setRefining(true);
    setRefineError("");
    try {
      const res = await api.refine(
        inspection,
        answers,
        lang,
        inspectionId || undefined,
        intake.area,
        intake.city,
      );
      setDiagnosis(res);
      if (res.estimate) setEstimate(res.estimate);
      if (res.primary_trade) {
        setTrade(res.primary_trade);
        setOffer(SUGGESTED[res.primary_trade] || 4500);
      }
    } catch (err) {
      setRefineError((err as Error).message || "Specialist coordinator refinement failed.");
    } finally {
      setRefining(false);
    }
  }, [inspection, answers, lang, inspectionId, intake.area, intake.city]);

  const cause = likelyCause(
    (answers.bathroom as Answer) || null,
    (answers.rain as Answer) || null,
  );

  const setAnswer = useCallback((id: string, val: string) => setAnswers((s) => ({ ...s, [id]: val })), []);
  const setIntakePart = useCallback((p: Partial<Intake>) => setIntake((i) => ({ ...i, ...p })), []);

  const restart = () => {
    intake.photos.forEach((u) => {
      if (u.startsWith("blob:")) URL.revokeObjectURL(u);
    });
    try {
      window.sessionStorage.removeItem(SESSION_INSP_KEY);
    } catch {
      /* ignore */
    }
    setIntake(FRESH_INTAKE);
    setInspectionId("");
    setInspection(null);
    setScanError("");
    setAnswers({});
    setDiagnosis(null);
    setEstimate(null);
    setQuoteMode(null);
    setItems([]);
    setStatedTotal(null);
    setFindings(null);
    setContractorName("");
    setAiExplanation(null);
    setSent(false);
    setBooked(null);
    setStep(0);
  };

  const back = () => {
    if (step === 4 && sent) return setSent(false);
    setStep((s) => Math.max(0, s - 1));
  };

  let actions: ReactNode = null;

  if (step === 0) {
    actions = (
      <PrimaryButton
        onClick={() => {
          if (!intake.consent) return;
          if (!intake.photo && intake.files.length === 0) {
            setIntake((i) => ({ ...i, usingSample: true }));
          }
          setStep(1);
          setTimeout(() => runVisualInspection(), 50);
        }}
      >
        {intake.photo || intake.files.length > 0
          ? t({ en: "Run AI Inspection", ur: "اے آئی معائنہ شروع کریں" })
          : t({ en: "Run AI Inspection with Sample Photo", ur: "نمونے کی تصویر سے اے آئی معائنہ کریں" })}
        <ArrowRight className="h-5 w-5 flip-rtl" />
      </PrimaryButton>
    );
  } else if (step === 1) {
    actions = (
      <>
        <BackButton onClick={back} />
        {inspection && !scanLoading ? (
          <PrimaryButton onClick={() => setStep(2)}>
            {t({ en: "Continue to Follow-up Questions", ur: "اگلا: ماہرین کے سوالات" })}
            <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        ) : (
          <Hint>
            {scanLoading
              ? t({ en: "Wait for Gemini Vision to finish inspecting…", ur: "براہ کرم جیمنائی معائنہ مکمل ہونے کا انتظار کریں…" })
              : t({ en: "Retry or go back", ur: "دوبارہ کوشش کریں" })}
          </Hint>
        )}
      </>
    );
  } else if (step === 2) {
    actions = (
      <>
        <BackButton onClick={back} />
        {diagnosis ? (
          <PrimaryButton onClick={() => setStep(3)}>
            {t({ en: "Next: Cost Estimate & Quote Audit", ur: "اگلا: تخمینی لاگت اور تخمینہ آڈٹ" })}
            <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        ) : (
          <Hint>
            {t({
              en: "Answer the questions above and tap 'Get Final Specialist Diagnosis'",
              ur: "اوپر سوالات کے جواب دیں اور حتمی تشخیص حاصل کریں",
            })}
          </Hint>
        )}
      </>
    );
  } else if (step === 3) {
    actions = (
      <>
        <BackButton onClick={back} />
        {quoteMode ? (
          <PrimaryButton onClick={() => setStep(4)}>
            {t({ en: "Next: Discover Nearby Contractors", ur: "اگلا: قریبی کاریگر تلاش کریں" })}
            <ArrowRight className="h-5 w-5 flip-rtl" />
          </PrimaryButton>
        ) : (
          <Hint>{t({ en: "Choose one option above", ur: "اوپر ایک آپشن چنیں" })}</Hint>
        )}
      </>
    );
  } else if (step === 4) {
    actions = (
      <>
        <BackButton onClick={back} />
        {sent ? (
          <PrimaryButton
            tone="leaf"
            onClick={() => {
              setBooked({ worker: null, price: offer });
              setStep(5);
            }}
          >
            <FileCheck className="h-5 w-5" />
            {t({ en: "View Full Inspection Report", ur: "مکمل رپورٹ دیکھیں" })}
          </PrimaryButton>
        ) : (
          <>
            <PrimaryButton onClick={() => setSent(true)}>
              <Send className="h-5 w-5 flip-rtl" />
              {t({ en: "Broadcast Offer", ur: "پیشکش بھیجیں" })}
            </PrimaryButton>
            <PrimaryButton
              tone="leaf"
              onClick={() => {
                setBooked({ worker: null, price: offer });
                setStep(5);
              }}
            >
              <FileCheck className="h-5 w-5" />
              {t({ en: "Save Report", ur: "رپورٹ محفوظ کریں" })}
            </PrimaryButton>
          </>
        )}
      </>
    );
  } else if (step === 5) {
    actions = <PrimaryButton onClick={restart}>{t({ en: "Start a new check", ur: "نیا چیک شروع کریں" })}</PrimaryButton>;
  }

  return (
    <CheckShell
      step={step}
      guide={GUIDE[step]}
      mood={step === 1 ? "think" : step === 5 ? "wink" : "happy"}
      onRestart={restart}
      actions={actions}
    >
      {step === 0 && <StepPhoto intake={intake} set={setIntakePart} />}
      {step === 1 && (
        <StepScan
          photo={intake.photo || inspection?.image_urls?.[0] || null}
          inspection={inspection}
          loading={scanLoading}
          error={scanError}
          onRetry={runVisualInspection}
        />
      )}
      {step === 2 && (
        <StepExperts
          inspection={inspection}
          answers={answers}
          setAnswer={setAnswer}
          diagnosis={diagnosis}
          refining={refining}
          refineError={refineError}
          onRunRefine={runSpecialistRefine}
          language={lang}
        />
      )}
      {step === 3 && (
        <StepPrice
          cause={cause}
          diagnosis={diagnosis}
          estimate={estimate}
          inspectionId={inspectionId}
          city={intake.city}
          area={intake.area}
          mode={quoteMode}
          setMode={setQuoteMode}
          items={items}
          setItems={setItems}
          statedTotal={statedTotal}
          setStatedTotal={setStatedTotal}
          findings={findings}
          setFindings={setFindings}
          contractorName={contractorName}
          setContractorName={setContractorName}
          aiExplanation={aiExplanation}
          setAiExplanation={setAiExplanation}
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
          city={intake.city}
          neighbourhood={intake.neighbourhood}
          inspectionId={inspectionId}
          onAccept={(worker, price) => {
            setBooked({ worker, price });
            setStep(5);
          }}
        />
      )}
      {step === 5 && (
        <StepBooked
          worker={booked?.worker ?? null}
          price={booked?.price ?? offer}
          cause={cause}
          problem={intake.problem}
          inspectionId={inspectionId}
          city={intake.city}
          neighbourhood={intake.neighbourhood}
          room={intake.room}
          areaSqft={intake.area}
          photos={inspection?.image_urls?.length ? inspection.image_urls : intake.photos}
          inspection={inspection}
          answers={answers}
          diagnosis={diagnosis}
          estimate={estimate}
          quoteItems={items}
          statedTotal={statedTotal}
          findings={findings}
          contractorName={contractorName}
          aiExplanation={aiExplanation}
        />
      )}
    </CheckShell>
  );
}
