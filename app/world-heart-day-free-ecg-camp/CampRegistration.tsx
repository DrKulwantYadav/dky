"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const whatsappMessage = "https://wa.me/919205775932?text=I%20would%20like%20to%20register%20for%20the%20Free%20ECG%20and%20Heart%20Check-up%20Camp.";

type Step = "closed" | "form" | "success";

export default function CampRegistration({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState<Step>("closed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (step === "closed") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setStep("closed");
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [step]);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/camp-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Registration could not be completed.");
      form.reset();
      setStep("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration could not be completed. Please try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  async function referSomeone() {
    const shareData = {
      title: "Free ECG and Heart Check-up Camp",
      text: "A healthy heart is a gift worth sharing. Join this free ECG and heart check-up camp at Gopinath Hospital, Bhiwadi.",
      url: `${window.location.origin}/world-heart-day-free-ecg-camp`,
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShared(true);
      }
    } catch {
      // The visitor may cancel the native share sheet; no error is needed.
    }
  }

  return <>
    <div className={`camp-registration-options${compact ? " compact" : ""}`}>
      <button type="button" onClick={() => { setError(""); setStep("form"); }}>Register through website <span>→</span></button>
      <a href={whatsappMessage} target="_blank" rel="noopener noreferrer">Register on WhatsApp <span>↗</span></a>
    </div>

    {step !== "closed" && <div className="camp-form-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setStep("closed");
    }}>
      <section className="camp-form-modal" role="dialog" aria-modal="true" aria-labelledby="camp-form-title">
        <button ref={closeButton} className="camp-form-close" type="button" onClick={() => setStep("closed")} aria-label="Close registration form">×</button>

        {step === "form" ? <>
          <p>Free ECG &amp; heart check-up camp</p>
          <h2 id="camp-form-title">Reserve your place</h2>
          <form onSubmit={submitRegistration}>
            <label><span>Name</span><input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required/></label>
            <div className="camp-form-row">
              <label><span>Age</span><input name="age" type="number" inputMode="numeric" min="1" max="120" required/></label>
              <label><span>Mobile number</span><input name="mobile" type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+ ()-]{10,18}" required/></label>
            </div>
            <label><span>Who is the check-up for?</span><select name="registrationFor" defaultValue="" required><option value="" disabled>Select one</option><option value="self">Myself</option><option value="parent">Parent</option><option value="sibling">Brother or sister</option><option value="other">Another family member</option></select></label>
            <label className="camp-form-consent"><input name="consent" type="checkbox" required/><span>I consent to the clinic using these details to contact me about this free camp.</span></label>
            <input className="camp-form-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
            {error && <p className="camp-form-error" role="alert">{error}</p>}
            <button className="camp-form-submit" type="submit" disabled={submitting}>{submitting ? "Registering…" : "Complete registration"}</button>
          </form>
        </> : <div className="camp-form-success">
          <span aria-hidden="true">♥</span>
          <p>Thank you for taking a caring step.</p>
          <h2 id="camp-form-title">Your registration is received.</h2>
          <p>A healthier heart can mean more time, more memories and more moments with the people who matter. Help someone you care about take the same step.</p>
          <button type="button" onClick={referSomeone}>{shared ? "Referral link copied" : "Refer someone you care about"} <span>↗</span></button>
          <a href={whatsappMessage} target="_blank" rel="noopener noreferrer">Continue on WhatsApp <span>↗</span></a>
        </div>}
      </section>
    </div>}
  </>;
}
