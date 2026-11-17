"use client";

import { useState, type FormEvent } from "react";

export default function ObesityBmiCalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [error, setError] = useState("");

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cm = Number(height);
    const kg = Number(weight);
    if (!Number.isFinite(cm) || !Number.isFinite(kg) || cm < 90 || cm > 250 || kg < 20 || kg > 350) {
      setBmi(null);
      setError("Enter a height between 90–250 cm and weight between 20–350 kg.");
      return;
    }
    setBmi(kg / (cm / 100) ** 2);
    setError("");
  }

  const category = bmi === null ? "" : bmi < 18.5 ? "Below the WHO adult reference range" : bmi < 25 ? "Within the WHO adult reference range" : bmi < 30 ? "Above the WHO adult reference range" : "In the WHO adult obesity range";

  return <form className="owm-bmi-card" onSubmit={calculate}>
    <span className="owm-kicker">A useful starting point</span>
    <h3>Calculate your BMI</h3>
    <p>Body Mass Index compares weight with height. Enter your measurements to see an estimate.</p>
    <div className="owm-bmi-fields">
      <label>Height <span>centimetres</span><input type="number" inputMode="decimal" min="90" max="250" step="0.1" placeholder="165" value={height} onChange={event => { setHeight(event.target.value); setBmi(null); }} required /></label>
      <label>Weight <span>kilograms</span><input type="number" inputMode="decimal" min="20" max="350" step="0.1" placeholder="70" value={weight} onChange={event => { setWeight(event.target.value); setBmi(null); }} required /></label>
    </div>
    <button type="submit">See my BMI <span aria-hidden="true">→</span></button>
    {error && <p className="owm-bmi-error" role="alert">{error}</p>}
    {bmi !== null && <div className="owm-bmi-result" aria-live="polite"><span>Your estimated BMI</span><strong>{bmi.toFixed(1)} <small>kg/m²</small></strong><p>{category}</p></div>}
    <small>For adults only. BMI is a screening measure, not a diagnosis. It does not distinguish muscle from body fat, and risk assessment may differ for South Asian adults. Measurements stay on this device.</small>
  </form>;
}
