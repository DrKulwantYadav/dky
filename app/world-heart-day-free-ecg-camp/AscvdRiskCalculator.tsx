"use client";

import { FormEvent, useState } from "react";
import styles from "./AscvdRiskCalculator.module.css";

type Race = "black" | "white" | "other";
type Sex = "male" | "female";

type Profile = {
  sex: Sex;
  race: Race;
  age: number;
  totalCholesterol: number;
  ldl: number;
  hdl: number;
  statin: boolean;
  systolicBp: number;
  hypertensionTreatment: boolean;
  diabetes: boolean;
  smoker: boolean;
  aspirin: boolean;
};

type Result = { risk: number; category: string; advice: string; otherRaceNote: boolean };

const initialProfile: Profile = { sex: "male", race: "white", age: 55, totalCholesterol: 200, ldl: 100, hdl: 50, statin: false, systolicBp: 120, hypertensionTreatment: false, diabetes: false, smoker: false, aspirin: false };

function calculateRisk(profile: Profile): number {
  const race: Exclude<Race, "other"> = profile.race === "other" ? "white" : profile.race;
  const age = Math.log(profile.age);
  const totalCholesterol = Math.log(profile.totalCholesterol);
  const hdl = Math.log(profile.hdl);
  const systolicBp = Math.log(profile.systolicBp);
  const smoking = profile.smoker ? 1 : 0;
  const diabetes = profile.diabetes ? 1 : 0;
  let sum: number;
  let baselineSurvival: number;
  let mean: number;

  if (race === "white" && profile.sex === "female") {
    sum = -29.799 * age + 4.884 * age ** 2 + 13.54 * totalCholesterol - 3.114 * age * totalCholesterol - 13.578 * hdl + 3.149 * age * hdl + (profile.hypertensionTreatment ? 2.019 : 1.957) * systolicBp + smoking * (7.574 - 1.665 * age) + 0.661 * diabetes;
    baselineSurvival = 0.9665; mean = -29.18;
  } else if (race === "white") {
    sum = 12.344 * age + 11.853 * totalCholesterol - 2.664 * age * totalCholesterol - 7.99 * hdl + 1.769 * age * hdl + (profile.hypertensionTreatment ? 1.797 : 1.764) * systolicBp + smoking * (7.837 - 1.795 * age) + 0.658 * diabetes;
    baselineSurvival = 0.9144; mean = 61.18;
  } else if (profile.sex === "female") {
    const bpTerms = profile.hypertensionTreatment ? 29.291 * systolicBp - 6.432 * age * systolicBp : 27.82 * systolicBp - 6.087 * age * systolicBp;
    sum = 17.114 * age + 0.94 * totalCholesterol - 18.92 * hdl + 4.475 * age * hdl + bpTerms + 0.691 * smoking + 0.874 * diabetes;
    baselineSurvival = 0.9533; mean = 86.61;
  } else {
    sum = 2.469 * age + 0.302 * totalCholesterol - 0.307 * hdl + (profile.hypertensionTreatment ? 1.916 : 1.809) * systolicBp + 0.549 * smoking + 0.645 * diabetes;
    baselineSurvival = 0.8954; mean = 19.54;
  }

  return Math.max(0, Math.min(100, (1 - baselineSurvival ** Math.exp(sum - mean)) * 100));
}

function riskDetails(risk: number): Pick<Result, "category" | "advice"> {
  if (risk < 5) return { category: "Low risk", advice: "Continue healthy lifestyle habits, including regular activity, a balanced diet, not smoking, and routine preventive care." };
  if (risk < 7.5) return { category: "Borderline risk", advice: "Discuss risk-enhancing factors and lifestyle optimisation with your doctor." };
  if (risk < 20) return { category: "Intermediate risk", advice: "Arrange a doctor’s visit. This range often starts discussions about moderate-intensity statin therapy and blood-pressure management." };
  return { category: "High risk", advice: "Consult a physician promptly. This level usually warrants an in-depth discussion about intensive risk-factor management and medical treatment." };
}

function NumberField({ label, name, value, min, max, unit, onChange }: { label: string; name: keyof Profile; value: number; min?: number; max?: number; unit: string; onChange: (name: keyof Profile, value: number) => void }) {
  return <label className={styles.field}><span>{label}</span><div><input type="number" name={name} value={value} min={min} max={max} required onChange={(event) => onChange(name, Number(event.target.value))}/><small>{unit}</small></div></label>;
}

export default function AscvdRiskCalculator() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const setNumber = (name: keyof Profile, value: number) => setProfile((current) => ({ ...current, [name]: value }));
  const setBoolean = (name: keyof Profile, value: boolean) => setProfile((current) => ({ ...current, [name]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = profile.age < 40 || profile.age > 79 || profile.totalCholesterol < 130 || profile.totalCholesterol > 320 || profile.hdl < 20 || profile.hdl > 100 || profile.systolicBp < 90 || profile.systolicBp > 200 || profile.ldl <= 0;
    if (invalid) { setError("Please enter values within the stated ranges before calculating."); return; }
    const risk = calculateRisk(profile);
    setResult({ risk, ...riskDetails(risk), otherRaceNote: profile.race === "other" });
    setError("");
  }

  return <section className={styles.calculator} id="cardio-risk-calculator" aria-labelledby="ascvd-title">
    <div className={styles.heading}><p className="section-label"><span>01</span> Prevention planning</p><h2 id="ascvd-title">10-Year Cardio <em>Risk Calculator</em></h2><p>Estimate the 10-year risk of a first atherosclerotic cardiovascular disease (ASCVD) event with the ACC/AHA Pooled Cohort Equations.</p></div>
    {!result ? <form className={styles.form} onSubmit={submit} noValidate>
      <fieldset><legend>Patient profile</legend><div className={styles.formGrid}>
        <div className={styles.choice}><span>Gender</span><label><input type="radio" name="sex" checked={profile.sex === "male"} onChange={() => setProfile((current) => ({ ...current, sex: "male" }))}/> Male</label><label><input type="radio" name="sex" checked={profile.sex === "female"} onChange={() => setProfile((current) => ({ ...current, sex: "female" }))}/> Female</label></div>
        <label className={styles.select}><span>Race</span><select value={profile.race} onChange={(event) => setProfile((current) => ({ ...current, race: event.target.value as Race }))}><option value="black">African American</option><option value="white">White</option><option value="other">Other</option></select></label>
        <NumberField label="Age" name="age" value={profile.age} min={40} max={79} unit="years" onChange={setNumber}/>
        <NumberField label="Total Cholesterol" name="totalCholesterol" value={profile.totalCholesterol} min={130} max={320} unit="mg/dL" onChange={setNumber}/>
        <NumberField label="LDL Cholesterol" name="ldl" value={profile.ldl} min={1} unit="mg/dL" onChange={setNumber}/>
        <NumberField label="HDL Cholesterol" name="hdl" value={profile.hdl} min={20} max={100} unit="mg/dL" onChange={setNumber}/>
        <NumberField label="Systolic Blood Pressure" name="systolicBp" value={profile.systolicBp} min={90} max={200} unit="mmHg" onChange={setNumber}/>
      </div></fieldset>
      <fieldset><legend>Current treatment and history</legend><div className={styles.checks}>
        <label><input type="checkbox" checked={profile.statin} onChange={(event) => setBoolean("statin", event.target.checked)}/> Treatment with statin</label>
        <label><input type="checkbox" checked={profile.hypertensionTreatment} onChange={(event) => setBoolean("hypertensionTreatment", event.target.checked)}/> Treatment for hypertension</label>
        <label><input type="checkbox" checked={profile.diabetes} onChange={(event) => setBoolean("diabetes", event.target.checked)}/> History of diabetes</label>
        <label><input type="checkbox" checked={profile.smoker} onChange={(event) => setBoolean("smoker", event.target.checked)}/> Current smoker</label>
        <label><input type="checkbox" checked={profile.aspirin} onChange={(event) => setBoolean("aspirin", event.target.checked)}/> Aspirin therapy</label>
      </div></fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <p className={styles.modelNote}>The baseline PCE uses age, total/HDL cholesterol, systolic pressure, hypertension treatment, smoking and diabetes. LDL, statin treatment and aspirin therapy are collected for a clinician discussion but do not alter this standard baseline equation.</p>
      <button type="submit">Calculate baseline risk <span>→</span></button>
    </form> : <div className={styles.result} aria-live="polite"><p>Estimated 10-year ASCVD risk</p><strong>{result.risk.toFixed(1)}<small>%</small></strong><h3>{result.category}</h3><p>{result.advice}</p>{result.otherRaceNote && <p className={styles.warning}>The original PCE was validated for Black and White US adults. “Other” uses the White equation as an approximation and may not be accurate for you.</p>}<button type="button" onClick={() => setResult(null)}>Edit details</button></div>}
    <aside className={styles.disclaimer}><strong>Medical disclaimer</strong><p>This calculator is for informational purposes only. It relies on standardised Pooled Cohort Equations and does not replace a professional medical assessment, diagnosis or personalised advice. Seek urgent medical care for chest pain, severe breathlessness, fainting, stroke symptoms or another serious symptom.</p></aside>
  </section>;
}
