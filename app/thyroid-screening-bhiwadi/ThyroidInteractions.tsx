"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window { gtag?: (...args: unknown[]) => void; }
}

const whatsapp = "https://wa.me/919205775932?text=I%20would%20like%20to%20ask%20about%20the%20Ultra-Sensitive%20TSH%20Screening%20on%2010%20October%202026%20in%20Bhiwadi.";
const directions = "https://maps.app.goo.gl/W9QHHQxRkA5bGasi7";

function ga(event: string) {
  window.gtag?.("event", event, { campaign: "thyroid_screening_oct2026" });
}

export default function ThyroidInteractions() {
  const [step, setStep] = useState<"closed" | "form" | "success">("closed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let attempts = 0;
    const viewContentTimer = window.setInterval(() => {
      if (window.fbq) {
        window.fbq("track", "ViewContent", { content_name: "Thyroid Screening Bhiwadi" });
        window.clearInterval(viewContentTimer);
      } else if (++attempts >= 25) window.clearInterval(viewContentTimer);
    }, 200);
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const register = target.closest<HTMLElement>("[data-thyroid-register]");
      if (register) {
        openerRef.current = register;
        setError("");
        setStep("form");
        ga("registration_form_start");
        return;
      }
      const link = target.closest<HTMLAnchorElement>(".thyroid-page a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (link.dataset.thyroidTrack === "whatsapp" || href.startsWith("https://wa.me/")) {
        window.fbq?.("track", "Contact", { content_name: "Thyroid Screening Bhiwadi" });
        ga("whatsapp_click");
      }
      if (link.dataset.thyroidTrack === "phone" || href.startsWith("tel:")) ga("phone_click");
      if (link.dataset.thyroidTrack === "directions" || href.startsWith("https://maps.app.goo.gl/")) ga("directions_click");
    }
    document.addEventListener("click", handleClick);
    return () => {
      window.clearInterval(viewContentTimer);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    if (step === "closed") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setStep("closed");
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>("[data-thyroid-dialog]");
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]):not([tabindex="-1"]), select:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus();
    };
  }, [step]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const url = new URL(window.location.href);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const value = url.searchParams.get(key);
      if (value) data[key] = value.slice(0, 150);
    }
    try {
      const response = await fetch("/api/thyroid-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Registration could not be completed.");
      form.reset();
      setStep("success");
      if (result.accepted) {
        window.fbq?.("track", "Lead", { content_name: "Thyroid Screening Bhiwadi" });
        ga("registration_success");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration could not be completed. Please use WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "closed") return null;
  return <div className="thyroid-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStep("closed"); }}>
    <section className="thyroid-modal" data-thyroid-dialog role="dialog" aria-modal="true" aria-labelledby="thyroid-modal-title">
      <button ref={closeRef} type="button" className="thyroid-modal-close" aria-label="Close registration" onClick={() => setStep("closed")}>×</button>
      {step === "form" ? <>
        <p className="thyroid-kicker">10 October 2026 · Bhiwadi</p>
        <h2 id="thyroid-modal-title">Register for Your Thyroid Screening</h2>
        <p>One short form. The hospital team may contact you to confirm the test price, timing and other details.</p>
        <form onSubmit={submit}>
          <label>Full Name<input name="name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Name of person being screened" /></label>
          <div className="thyroid-modal-row"><label>Age<input name="age" type="number" inputMode="numeric" min="18" max="120" required placeholder="18+" /></label><label>Mobile Number<input name="mobile" type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[ -]?)?[6-9][0-9]{9}" required placeholder="10-digit number" /></label></div>
          <label>Who are you registering for?<select name="registrationFor" defaultValue="" required><option value="" disabled>Select one</option><option value="self">Myself</option><option value="parent">Parent</option><option value="spouse">Spouse</option><option value="family">Family Member</option></select></label>
          <label className="thyroid-consent"><input name="consent" type="checkbox" required /><span>I agree that the hospital team may use these details to contact me about this screening. <a href="/policies#privacy" target="_blank">Privacy policy</a></span></label>
          <input name="website" className="thyroid-honeypot" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {error && <p className="thyroid-form-error" role="alert">{error}</p>}
          <button className="thyroid-button" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Register for Screening"}<span aria-hidden="true">→</span></button>
        </form>
      </> : <div className="thyroid-success" role="status">
        <span className="thyroid-success-icon" aria-hidden="true">✓</span>
        <h2 id="thyroid-modal-title">Registration Received</h2>
        <p>Your thyroid screening request has been received. Our team may contact you to confirm the screening details.</p>
        <dl><div><dt>Date</dt><dd>Saturday, 10 October 2026</dd></div><div><dt>Time</dt><dd>To be confirmed by the hospital team</dd></div><div><dt>Venue</dt><dd>Gopinath Hospital, Bhiwadi, Rajasthan</dd></div></dl>
        <div className="thyroid-success-actions"><a href={directions} data-thyroid-track="directions" target="_blank" rel="noopener noreferrer">Google Maps / Directions ↗</a><a href={whatsapp} data-thyroid-track="whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div>
      </div>}
    </section>
  </div>;
}
