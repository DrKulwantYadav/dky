"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { findriscAnswersSchema, scoreFindrisc, type FindriscAnswers } from "@/lib/findrisc";
import "./findrisc.css";

type Language = "en" | "hi";
type AnswerField = keyof FindriscAnswers;
type Answers = Partial<Omit<FindriscAnswers, "heightCm" | "weightKg" | "waistCm">> &
  Partial<Record<"heightCm" | "weightKg" | "waistCm", string>>;

export const copy = {
  en: {
    eyebrow: "06 / Beyond glucose", title: "Check your type 2 diabetes risk with FINDRISC",
    intro: "Eight questions, no blood test. The Finnish Diabetes Risk Score estimates risk over the next 10 years for adults aged 18 or older who have not been diagnosed with diabetes.",
    already: "Already diagnosed with diabetes or had gestational diabetes? This score is not designed for you; speak with your clinician instead.",
    age: "1. What is your age group?", height: "Height (cm)", weight: "Weight (kg)", bmi: "2. Your Body Mass Index (BMI)",
    bmiHelp: "Enter height and weight to calculate BMI automatically. The BMI score uses the original FINDRISC cutoffs, which may not fully reflect South Asian risk.",
    waistSex: "3. For the waist score, which reference range applies?", waist: "Waist circumference at the navel (cm)", waistHelp: "Measure around your waist without pulling the tape tight.",
    activity: "4. Do you usually do at least 30 minutes of physical activity each day?",
    produce: "5. Do you eat vegetables, fruit or berries every day?",
    bp: "6. Have you regularly taken medicine for high blood pressure?",
    glucose: "7. Have you ever been found to have high blood glucose, including during illness or pregnancy?",
    family: "8. Has anyone in your family been diagnosed with diabetes?",
    yes: "Yes", no: "No", man: "Men's range", woman: "Women's range", none: "No", extended: "Grandparent, aunt, uncle or first cousin", immediate: "Parent, sibling or child",
    calculate: "See my risk score", missing: "Answer all eight questions and enter valid measurements to see your score.",
    score: "Your FINDRISC score", points: "points out of 26", estimate: "Original Finnish reference estimate", calibration: "These 10-year estimates come from Finnish populations. They are not a personal probability or validated for every Indian population.",
    disclaimer: "This screening tool assesses risk based on international FINDRISC standards and is not a medical diagnosis. Only a qualified healthcare provider and laboratory blood test can confirm diabetes.",
    contactTitle: "Save your assessment", contactIntro: "Enter your name and a phone number or email address. Your report will appear here after your details are saved. No email will be sent.",
    name: "Name", phone: "WhatsApp / phone (10-digit Indian mobile, optional)", email: "Email address (optional)", contactHelp: "Enter a 10-digit Indian mobile number or a valid email address, then give consent.",
    consent: "I consent to Dr. Kulwant Yadav's clinic storing my name, contact details, answers and risk score so authorised staff can view my request and contact me about this result. This is separate from advertising consent. No report email will be sent.",
    send: "Save and view my report", sending: "Saving assessment…", saved: "Your assessment was saved. This report is displayed only on this screen; no email has been sent. Clinic staff can view your request.",
    failed: "We could not save your assessment. Please retry with the same details.",
    retry: "We could not confirm whether your request was saved. Retry safely with the same details.",
    source: "About the original FINDRISC score", guide: "Explore practical lifestyle guidance", discuss: "Discuss screening with the clinic", call: "Call the clinic",
  },
  hi: {
    eyebrow: "06 / रक्त शर्करा से आगे", title: "FINDRISC से टाइप 2 मधुमेह का जोखिम समझें",
    intro: "आठ सवाल, बिना रक्त जाँच। यह फ़िनिश स्कोर 18 वर्ष या उससे अधिक उम्र के उन वयस्कों के लिए अगले 10 साल के जोखिम का अनुमान देता है जिन्हें मधुमेह का निदान नहीं हुआ है।",
    already: "यदि आपको पहले से मधुमेह है या गर्भावस्था में मधुमेह हुआ था, तो यह स्कोर आपके लिए नहीं है। डॉक्टर से बात करें।",
    age: "1. आपकी उम्र किस समूह में है?", height: "लंबाई (सेमी)", weight: "वजन (किलो)", bmi: "2. आपका बॉडी मास इंडेक्स (BMI)",
    bmiHelp: "BMI अपने आप निकालने के लिए लंबाई और वजन भरें। मूल FINDRISC सीमाएँ दक्षिण एशियाई जोखिम को पूरी तरह नहीं दर्शा सकतीं।",
    waistSex: "3. कमर के स्कोर के लिए कौन-सी सीमा लागू होती है?", waist: "नाभि पर कमर का माप (सेमी)", waistHelp: "फीता बहुत कसकर न खींचें।",
    activity: "4. क्या आप सामान्यतः रोज़ कम से कम 30 मिनट शारीरिक गतिविधि करते हैं?",
    produce: "5. क्या आप रोज़ सब्ज़ियाँ, फल या बेरी खाते हैं?", bp: "6. क्या आपने नियमित रूप से उच्च रक्तचाप की दवा ली है?",
    glucose: "7. क्या कभी आपकी रक्त शर्करा अधिक पाई गई है, बीमारी या गर्भावस्था के दौरान भी?",
    family: "8. क्या परिवार में किसी को मधुमेह है?", yes: "हाँ", no: "नहीं", man: "पुरुषों की सीमा", woman: "महिलाओं की सीमा", none: "नहीं", extended: "दादा-दादी, नाना-नानी, चाचा-चाची, मामा-मामी या चचेरे भाई-बहन", immediate: "माता-पिता, भाई-बहन या बच्चा",
    calculate: "मेरा जोखिम स्कोर देखें", missing: "सभी आठ सवालों और मापों को सही भरें।", score: "आपका FINDRISC स्कोर", points: "अंक / 26", estimate: "मूल फ़िनिश आबादी का अनुमान", calibration: "ये 10 साल के अनुमान फ़िनलैंड की आबादी से हैं। ये आपकी व्यक्तिगत संभावना नहीं हैं और हर भारतीय आबादी के लिए प्रमाणित नहीं हैं।",
    disclaimer: "यह जाँच अंतरराष्ट्रीय FINDRISC मानक पर जोखिम का अनुमान देती है, निदान नहीं। मधुमेह की पुष्टि योग्य चिकित्सक और प्रयोगशाला रक्त जाँच से ही हो सकती है।",
    contactTitle: "अपना आकलन सहेजें", contactIntro: "अपना नाम और फ़ोन नंबर या ईमेल पता दर्ज करें। विवरण सहेजने के बाद रिपोर्ट यहीं दिखेगी। ईमेल नहीं भेजा जाएगा।",
    name: "नाम", phone: "व्हाट्सऐप / फ़ोन (10 अंक, वैकल्पिक)", email: "ईमेल पता (वैकल्पिक)", contactHelp: "10 अंकों का मोबाइल नंबर या सही ईमेल पता दर्ज करें और सहमति दें।",
    consent: "मैं डॉ. कुलवंत यादव के क्लिनिक को मेरा नाम, संपर्क, जवाब और जोखिम स्कोर सहेजने की सहमति देता/देती हूँ ताकि अधिकृत कर्मचारी मेरा अनुरोध देख सकें और इस परिणाम के बारे में संपर्क कर सकें। यह विज्ञापन सहमति से अलग है। रिपोर्ट ईमेल से नहीं भेजी जाएगी।",
    send: "सहेजें और रिपोर्ट देखें", sending: "आकलन सहेजा जा रहा है…", saved: "आपका आकलन सहेजा गया। रिपोर्ट केवल इस स्क्रीन पर दिखाई गई है; ईमेल नहीं भेजा गया है। क्लिनिक कर्मचारी आपका अनुरोध देख सकते हैं।",
    failed: "आकलन सहेजा नहीं जा सका। इन्हीं विवरणों के साथ फिर कोशिश करें।", retry: "अनुरोध सहेजा गया या नहीं, इसकी पुष्टि नहीं हो सकी। इन्हीं विवरणों के साथ सुरक्षित रूप से फिर कोशिश करें।",
    source: "मूल FINDRISC के बारे में", guide: "जीवनशैली के उपयोगी सुझाव", discuss: "जाँच पर क्लिनिक से बात करें", call: "क्लिनिक को कॉल करें",
  },
} as const;

export const tiers = {
  low: { en: "Low risk", hi: "कम जोखिम", odds: "about 1 in 100", oddsHi: "लगभग 100 में 1", nextEn: "Keep up healthy everyday habits. Ask your clinician when routine screening is right for you.", nextHi: "स्वस्थ आदतें जारी रखें। नियमित जाँच कब करानी चाहिए, अपने डॉक्टर से पूछें।" },
  slightlyElevated: { en: "Slightly elevated risk", hi: "थोड़ा बढ़ा जोखिम", odds: "about 1 in 25", oddsHi: "लगभग 25 में 1", nextEn: "Discuss physical activity, food habits and a screening plan with a clinician.", nextHi: "शारीरिक गतिविधि, भोजन और जाँच की योजना पर डॉक्टर से बात करें।" },
  moderate: { en: "Moderate risk", hi: "मध्यम जोखिम", odds: "about 1 in 6", oddsHi: "लगभग 6 में 1", nextEn: "Ask a clinician whether a blood glucose or HbA1c test would be appropriate.", nextHi: "डॉक्टर से पूछें कि रक्त शर्करा या HbA1c जाँच आपके लिए उचित है या नहीं।" },
  high: { en: "High risk", hi: "अधिक जोखिम", odds: "about 1 in 3", oddsHi: "लगभग 3 में 1", nextEn: "Arrange a clinical discussion about blood testing and your individual risk factors.", nextHi: "रक्त जाँच और अपने व्यक्तिगत जोखिम कारकों के बारे में डॉक्टर से परामर्श करें।" },
  veryHigh: { en: "Very high risk", hi: "बहुत अधिक जोखिम", odds: "about 1 in 2", oddsHi: "लगभग 2 में 1", nextEn: "Contact a clinician promptly to discuss appropriate blood testing and next steps.", nextHi: "उचित रक्त जाँच और अगले कदमों के लिए जल्द डॉक्टर से संपर्क करें।" },
} as const;

function Choices({ legend, name, value, options, onChange }: { legend: string; name: string; value: string | boolean | undefined; options: [string, string | boolean][]; onChange: (value: string | boolean) => void }) {
  return <fieldset className="findrisc-question"><legend>{legend}</legend><div className="findrisc-choices">{options.map(([label, option]) => <label key={String(option)}><input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} /><span>{label}</span></label>)}</div></fieldset>;
}

export default function FindriscCalculator({ language }: { language: Language }) {
  const t = copy[language];
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ReturnType<typeof scoreFindrisc> | null>(null);
  const [calculatedAnswers, setCalculatedAnswers] = useState<FindriscAnswers | null>(null);
  const [error, setError] = useState("");
  const [contactError, setContactError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed" | "uncertain">("idle");
  const [submissionKey, setSubmissionKey] = useState("");
  const set = (field: AnswerField, value: string | boolean) => { setAnswers(previous => ({ ...previous, [field]: value })); setResult(null); setCalculatedAnswers(null); setSaveState("idle"); setSubmissionKey(""); };
  const resetRequest = () => { setSaveState("idle"); setSubmissionKey(""); };
  const currentBmi = Number(answers.heightCm) > 0 && Number(answers.weightKg) > 0
    ? Number(answers.weightKg) / (Number(answers.heightCm) / 100) ** 2 : null;

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = { age: answers.age, heightCm: Number(answers.heightCm), weightKg: Number(answers.weightKg),
      waistSex: answers.waistSex, waistCm: Number(answers.waistCm), activity: answers.activity,
      produceDaily: answers.produceDaily, bloodPressureMedicine: answers.bloodPressureMedicine,
      highGlucose: answers.highGlucose, family: answers.family };
    const parsed = findriscAnswersSchema.safeParse(candidate);
    if (!parsed.success) { setError(t.missing); return; }
    setCalculatedAnswers(parsed.data); setResult(scoreFindrisc(parsed.data)); setError("");
    window.setTimeout(() => document.getElementById("findrisc-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result || !calculatedAnswers || !consent || saveState === "saving" || saveState === "saved") return;
    const mobile = phone.trim();
    if ((mobile && !/^[6-9]\d{9}$/.test(mobile)) || (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) || (!mobile && !email.trim())) { setContactError(t.contactHelp); return; }
    setContactError("");
    const key = submissionKey || crypto.randomUUID();
    if (!submissionKey) setSubmissionKey(key);
    setSaveState("saving");
    try {
      const response = await fetch("/api/findrisc-leads", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionKey: key, name: name.trim(), phone: mobile, email: email.trim(), consent: true, answers: calculatedAnswers }) });
      if (response.ok) setSaveState("saved");
      else setSaveState(response.status >= 500 ? "uncertain" : "failed");
    } catch { setSaveState("uncertain"); }
  }

  const yesNo = (name: string, legend: string, value: string | boolean | undefined, field: AnswerField): ReactNode =>
    <Choices name={name} legend={legend} value={value} options={[[t.yes, true], [t.no, false]]} onChange={v => set(field, v)} />;

  return <div className="findrisc-wrap"><div className="db2-section-heading"><p className="db2-eyebrow">{t.eyebrow}</p><h2>{t.title}</h2><p>{t.intro}</p></div>
    <p className="findrisc-caution">{t.already}</p>
    <form className="findrisc-form" onSubmit={calculate} noValidate>
      <Choices name="age" legend={t.age} value={answers.age} options={[[language === "hi" ? "18–44 वर्ष" : "18–44 years", "under45"], ["45–54", "45to54"], ["55–64", "55to64"], [language === "hi" ? "65 या अधिक" : "65 or older", "65plus"]]} onChange={v => set("age", v)} />
      <fieldset className="findrisc-question"><legend>{t.bmi}</legend><p>{t.bmiHelp}</p><div className="findrisc-measures"><label>{t.height}<input type="number" min="100" max="250" step="0.1" inputMode="decimal" value={answers.heightCm ?? ""} onChange={e => set("heightCm", e.target.value)} /></label><label>{t.weight}<input type="number" min="25" max="350" step="0.1" inputMode="decimal" value={answers.weightKg ?? ""} onChange={e => set("weightKg", e.target.value)} /></label></div>{currentBmi !== null && Number.isFinite(currentBmi) && <p className="findrisc-bmi">BMI: {currentBmi.toFixed(1)} kg/m²</p>}</fieldset>
      <fieldset className="findrisc-question"><legend>{t.waistSex}</legend><div className="findrisc-choices">{([[t.man, "man"], [t.woman, "woman"]] as const).map(([label, value]) => <label key={value}><input type="radio" name="waistSex" checked={answers.waistSex === value} onChange={() => set("waistSex", value)} /><span>{label}</span></label>)}</div><label className="findrisc-waist">{t.waist}<input type="number" min="50" max="200" step="0.1" inputMode="decimal" value={answers.waistCm ?? ""} onChange={e => set("waistCm", e.target.value)} /></label><p>{t.waistHelp}</p></fieldset>
      {yesNo("activity", t.activity, answers.activity, "activity")}
      {yesNo("produceDaily", t.produce, answers.produceDaily, "produceDaily")}
      {yesNo("bloodPressureMedicine", t.bp, answers.bloodPressureMedicine, "bloodPressureMedicine")}
      {yesNo("highGlucose", t.glucose, answers.highGlucose, "highGlucose")}
      <Choices name="family" legend={t.family} value={answers.family} options={[[t.none, "none"], [t.extended, "extended"], [t.immediate, "immediate"]]} onChange={v => set("family", v)} />
      {error && <p className="findrisc-error" role="alert">{error}</p>}
      <button className="findrisc-primary" type="submit">{t.calculate} →</button>
    </form>
    {result && <div id="findrisc-result" className="findrisc-result"><p className="db2-eyebrow">{t.score}</p><div className="findrisc-result-top" aria-live="polite"><strong>{result.total} <small>{t.points}</small></strong><span>{tiers[result.tier][language]}</span></div><p><b>{t.estimate}:</b> {language === "hi" ? tiers[result.tier].oddsHi : tiers[result.tier].odds}.</p><p className="findrisc-caution">{t.calibration}</p><p>{t.disclaimer}</p><div className="findrisc-actions">{result.total < 12 ? <a href="#food">{t.guide} →</a> : result.total < 21 ? <Link href="/book-appointment">{t.discuss} →</Link> : <a href="tel:+919205775932">{t.call} →</a>}</div>
      <form className="findrisc-followup" onSubmit={save}><h3>{t.contactTitle}</h3><p>{t.contactIntro}</p><label>{t.name}<input required maxLength={120} autoComplete="name" value={name} onChange={e => { setName(e.target.value); resetRequest(); }} /></label><div className="findrisc-measures"><label>{t.phone}<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => { setPhone(e.target.value); resetRequest(); }} /></label><label>{t.email}<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); resetRequest(); }} /></label></div><p className="findrisc-help">{t.contactHelp}</p><label className="findrisc-consent"><input type="checkbox" required checked={consent} onChange={e => { setConsent(e.target.checked); resetRequest(); }} /><span>{t.consent}</span></label><button className="findrisc-primary" type="submit" disabled={saveState === "saving" || saveState === "saved"}>{saveState === "saving" ? t.sending : t.send}</button><p aria-live="polite" className="findrisc-error">{contactError}</p><p aria-live="polite" className={saveState === "saved" ? "findrisc-saved" : "findrisc-error"}>{saveState === "saved" ? t.saved : saveState === "uncertain" ? t.retry : saveState === "failed" ? t.failed : ""}</p></form>
    </div>}
    <div className="findrisc-sources"><a className="findrisc-source" href="https://diabetes.fi/lahteet-ja-kayttoohjeet-kansansairauksien-riskitesti/" target="_blank" rel="noopener noreferrer">{t.source} ↗</a><a className="findrisc-source" href="https://carpha.org/Portals/0/FINDRISC.pdf" target="_blank" rel="noopener noreferrer">{language === "hi" ? "मूल अंक और जोखिम श्रेणियाँ" : "Original score form and risk bands"} ↗</a></div>
  </div>;
}
