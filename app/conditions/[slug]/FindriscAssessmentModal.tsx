"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { findriscAnswersSchema, type FindriscAnswers } from "@/lib/findrisc";
import { copy, tiers } from "./FindriscCalculator";
import "./findrisc-assessment-modal.css";

type Language = "en" | "hi";
type Answers = Partial<Omit<FindriscAnswers, "heightCm" | "weightKg" | "waistCm">> &
  Partial<Record<"heightCm" | "weightKg" | "waistCm", string>>;
type AnswerField = keyof FindriscAnswers;
type Step = "questions" | "contact" | "result";
type SavedResult = { total: number; tier: keyof typeof tiers };

function Choices({ legend, name, value, options, onChange }: {
  legend: string; name: string; value: string | boolean | undefined;
  options: readonly (readonly [string, string | boolean])[];
  onChange: (value: string | boolean) => void;
}) {
  return <fieldset className="fr-modal-question"><legend>{legend}</legend><div className="fr-modal-options">
    {options.map(([label, option]) => <label key={String(option)} className="fr-modal-option">
      <input type="radio" name={`modal-${name}`} checked={value === option} onChange={() => onChange(option)} />
      <span className="fr-modal-option-dot" aria-hidden="true" /><span>{label}</span>
    </label>)}
  </div></fieldset>;
}

export default function FindriscAssessmentModal({ language }: { language: Language }) {
  const t = copy[language];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("questions");
  const [answers, setAnswers] = useState<Answers>({});
  const [validatedAnswers, setValidatedAnswers] = useState<FindriscAnswers | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [result, setResult] = useState<SavedResult | null>(null);
  const submissionKey = useRef<string | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOpen(new URLSearchParams(window.location.search).get("assessment") === "1"));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),a[href]")];
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [open]);

  function close() {
    setOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("assessment");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function set(field: AnswerField, value: string | boolean) {
    setAnswers(previous => ({ ...previous, [field]: value }));
    setValidatedAnswers(null);
    setError("");
    submissionKey.current = null;
  }

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = findriscAnswersSchema.safeParse({
      age: answers.age, heightCm: Number(answers.heightCm), weightKg: Number(answers.weightKg),
      waistSex: answers.waistSex, waistCm: Number(answers.waistCm), activity: answers.activity,
      produceDaily: answers.produceDaily, bloodPressureMedicine: answers.bloodPressureMedicine,
      highGlucose: answers.highGlucose, family: answers.family,
    });
    if (!parsed.success) { setError(t.missing); return; }
    setValidatedAnswers(parsed.data);
    setError("");
    setStep("contact");
    scroller.current?.scrollTo(0, 0);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !validatedAnswers) return;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2 || trimmedName.length > 120 ||
      (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) ||
      (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) ||
      (!trimmedPhone && !trimmedEmail) || !consent) {
      setError(t.contactHelp);
      return;
    }
    const key = submissionKey.current ?? crypto.randomUUID();
    submissionKey.current = key;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/findrisc-leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionKey: key, name: trimmedName, phone: trimmedPhone,
          email: trimmedEmail, consent: true, answers: validatedAnswers }),
      });
      const body: { status?: string; score?: number; riskTier?: string; error?: string } = await response.json();
      const savedScore = body.score;
      const savedTier = body.riskTier;
      if (response.ok && body.status === "saved" && typeof savedScore === "number" &&
        Number.isInteger(savedScore) && savedScore >= 0 && savedScore <= 26 &&
        savedTier && Object.hasOwn(tiers, savedTier)) {
        setResult({ total: savedScore, tier: savedTier as keyof typeof tiers });
        setStep("result");
        setUncertain(false);
        scroller.current?.scrollTo(0, 0);
      } else {
        const resultUnknown = response.ok || (response.status >= 500 && body.error?.startsWith("Could not confirm"));
        setUncertain(Boolean(resultUnknown));
        setError(body.error || t.retry);
      }
    } catch {
      setUncertain(true);
      setError(t.retry);
    } finally { setSaving(false); }
  }

  const resetRequest = () => { submissionKey.current = null; setUncertain(false); setError(""); };
  const yesNo = (field: "activity" | "produceDaily" | "bloodPressureMedicine" | "highGlucose", legend: string) =>
    <Choices name={field} legend={legend} value={answers[field]} options={[[t.yes, true], [t.no, false]]} onChange={value => set(field, value)} />;
  const bmi = Number(answers.heightCm) > 0 && Number(answers.weightKg) > 0
    ? Number(answers.weightKg) / (Number(answers.heightCm) / 100) ** 2 : null;

  if (!open) return null;
  return <div className="fr-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialog} className="fr-modal" role="dialog" aria-modal="true" aria-labelledby="fr-modal-title">
      <header className="fr-modal-header"><div className="fr-modal-brand"><span className="fr-modal-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></div><button ref={closeButton} type="button" onClick={close} aria-label="Close assessment">Close <span aria-hidden="true">×</span></button></header>
      <div ref={scroller} className="fr-modal-scroll">
        {step === "questions" && <><p className="fr-modal-eyebrow">FINDRISC · Finnish Diabetes Risk Score</p><h2 id="fr-modal-title">Check your type 2 diabetes risk</h2><p className="fr-modal-intro">{t.intro}</p><p className="fr-modal-caution">{t.already}</p>
          <form onSubmit={advance} noValidate className="fr-modal-form">
            <Choices name="age" legend={t.age} value={answers.age} options={[[language === "hi" ? "18–44 वर्ष" : "18–44 years", "under45"], ["45–54", "45to54"], ["55–64", "55to64"], [language === "hi" ? "65 या अधिक" : "65 or older", "65plus"]]} onChange={value => set("age", value)} />
            <fieldset className="fr-modal-question"><legend>{t.bmi}</legend><p>{t.bmiHelp}</p><div className="fr-modal-measures"><label>{t.height}<input type="number" min="100" max="250" step="0.1" inputMode="decimal" value={answers.heightCm ?? ""} onChange={event => set("heightCm", event.target.value)} /></label><label>{t.weight}<input type="number" min="25" max="350" step="0.1" inputMode="decimal" value={answers.weightKg ?? ""} onChange={event => set("weightKg", event.target.value)} /></label></div>{bmi !== null && Number.isFinite(bmi) && <p className="fr-modal-bmi">BMI: {bmi.toFixed(1)} kg/m²</p>}</fieldset>
            <fieldset className="fr-modal-question"><legend>{t.waistSex}</legend><div className="fr-modal-options">{([[t.man, "man"], [t.woman, "woman"]] as const).map(([label, value]) => <label key={value} className="fr-modal-option"><input type="radio" name="modal-waistSex" checked={answers.waistSex === value} onChange={() => set("waistSex", value)} /><span className="fr-modal-option-dot" aria-hidden="true" /><span>{label}</span></label>)}</div><label className="fr-modal-waist">{t.waist}<input type="number" min="50" max="200" step="0.1" inputMode="decimal" value={answers.waistCm ?? ""} onChange={event => set("waistCm", event.target.value)} /></label><p>{t.waistHelp}</p></fieldset>
            {yesNo("activity", t.activity)}{yesNo("produceDaily", t.produce)}{yesNo("bloodPressureMedicine", t.bp)}{yesNo("highGlucose", t.glucose)}
            <Choices name="family" legend={t.family} value={answers.family} options={[[t.none, "none"], [t.extended, "extended"], [t.immediate, "immediate"]]} onChange={value => set("family", value)} />
            {error && <p className="fr-modal-error" role="alert">{error}</p>}
            <button type="submit" className="fr-modal-primary">{t.calculate} <span aria-hidden="true">→</span></button>
            <p className="fr-modal-small">{t.disclaimer}</p>
          </form></>}
        {step === "contact" && <><p className="fr-modal-eyebrow">Your assessment record</p><h2 id="fr-modal-title">{t.contactTitle}</h2><p className="fr-modal-intro">{t.contactIntro}</p>
          <form onSubmit={save} className="fr-modal-contact" noValidate><label>{t.name} <span aria-hidden="true">*</span><input autoComplete="name" maxLength={120} value={name} disabled={uncertain} onChange={event => { setName(event.target.value); resetRequest(); }} /></label>
            <label>{t.phone}<input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" value={phone} disabled={uncertain} onChange={event => { setPhone(event.target.value); resetRequest(); }} /></label>
            <label>{t.email}<input type="email" autoComplete="email" value={email} disabled={uncertain} onChange={event => { setEmail(event.target.value); resetRequest(); }} /></label>
            <p className="fr-modal-small">{t.contactHelp}</p>
            <label className="fr-modal-consent"><input type="checkbox" checked={consent} disabled={uncertain} onChange={event => { setConsent(event.target.checked); resetRequest(); }} /><span>{t.consent}</span></label>
            {error && <p className="fr-modal-error" role="alert">{error}</p>}
            <button type="submit" className="fr-modal-primary" disabled={saving}>{saving ? t.sending : uncertain ? "Retry safely with the same details" : t.send}</button>
            <button type="button" className="fr-modal-secondary" disabled={saving || uncertain} onClick={() => { setStep("questions"); scroller.current?.scrollTo(0, 0); }}>Back to questions</button>
          </form></>}
        {step === "result" && result && <div className="fr-modal-result"><p className="fr-modal-eyebrow">{t.score}</p><h2 id="fr-modal-title">{language === "hi" ? "आपकी रिपोर्ट तैयार है" : "Your report is ready"}</h2><p>{language === "hi" ? `${name.trim()}, आपका आकलन सहेजा गया है।` : `${name.trim()}, your assessment has been saved.`}</p><div className="fr-modal-score"><strong>{result.total}</strong><span>{t.points}</span></div><h3>{tiers[result.tier][language]}</h3><p><b>{t.estimate}:</b> {language === "hi" ? tiers[result.tier].oddsHi : tiers[result.tier].odds}.</p><p className="fr-modal-caution">{t.calibration}</p><h3>{language === "hi" ? "अगला कदम" : "Suggested next step"}</h3><p>{language === "hi" ? tiers[result.tier].nextHi : tiers[result.tier].nextEn}</p><p>{t.disclaimer}</p><p className="fr-modal-saved">{t.saved}</p><button className="fr-modal-primary" type="button" onClick={close}>Close assessment</button></div>}
      </div>
    </section>
  </div>;
}
