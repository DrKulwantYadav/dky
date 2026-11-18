"use client";

import { useState, type FormEvent } from "react";

export default function ObesityWaistHipCalculator() {
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [ratio, setRatio] = useState<number | null>(null);
  const [error, setError] = useState("");

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const waistCm = Number(waist);
    const hipCm = Number(hip);
    if (!Number.isFinite(waistCm) || !Number.isFinite(hipCm) || waistCm < 40 || waistCm > 250 || hipCm < 50 || hipCm > 250) {
      setRatio(null);
      setError("Enter a waist measurement between 40–250 cm and a hip measurement between 50–250 cm.");
      return;
    }
    setRatio(waistCm / hipCm);
    setError("");
  }

  return <form className="owm-bmi-card" onSubmit={calculate}>
    <span className="owm-kicker">Another useful measure</span>
    <h3>Calculate your waist-to-hip ratio</h3>
    <p>Measure your waist and the widest part of your hips with a flexible tape. Divide waist by hip to estimate how weight is distributed.</p>
    <div className="owm-bmi-fields">
      <label>Waist <span>centimetres</span><input type="number" inputMode="decimal" min="40" max="250" step="0.1" placeholder="80" value={waist} onChange={event => { setWaist(event.target.value); setRatio(null); setError(""); }} required /></label>
      <label>Hips <span>centimetres</span><input type="number" inputMode="decimal" min="50" max="250" step="0.1" placeholder="100" value={hip} onChange={event => { setHip(event.target.value); setRatio(null); setError(""); }} required /></label>
    </div>
    <button type="submit">See my ratio <span aria-hidden="true">→</span></button>
    {error && <p className="owm-bmi-error" role="alert">{error}</p>}
    {ratio !== null && <div className="owm-bmi-result" aria-live="polite"><span>Your estimated waist-to-hip ratio</span><strong>{ratio.toFixed(2)}</strong><p>Calculated as waist ÷ hips, using the same unit for both.</p></div>}
    <small>For adults only. This is a screening measure, not a diagnosis. Interpretation varies by sex and individual health factors; discuss your result with a clinician. Measurements stay on this device.</small>
  </form>;
}
