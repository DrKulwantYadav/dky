"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { slotLabel } from "@/lib/appointment-slots";

const reasons = ["Diabetes", "Blood pressure", "Fatty liver", "Weight management", "Fever or infection", "Respiratory problem", "Digestive problem", "Headache", "Seizure follow-up", "Kidney-related concern", "Report review", "Other medical concern"];
const whatsappUrl = "https://wa.me/919205775932?text=Hello%2C%20I%20would%20like%20to%20request%20an%20appointment%20with%20Dr.%20Kulwant%20Yadav.";
type Slot = { id: string; startTime: string };

export default function AppointmentForm() {
  const [dateBounds] = useState(() => {
    const todayIndia = Date.now() + 330 * 60_000;
    return {
      min: new Date(todayIndia).toISOString().slice(0, 10),
      max: new Date(todayIndia + 365 * 86_400_000).toISOString().slice(0, 10),
    };
  });
  const [preferredDate, setPreferredDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookedLabel, setBookedLabel] = useState("");
  const [error, setError] = useState("");
  const availabilityRequest = useRef<AbortController | null>(null);

  useEffect(() => () => availabilityRequest.current?.abort(), []);

  async function loadSlots(date: string) {
    availabilityRequest.current?.abort();
    setPreferredDate(date);
    setSelectedSlot("");
    setSlots([]);
    setSlotError("");
    setSlotLoading(!!date);
    if (!date) return;
    const controller = new AbortController();
    availabilityRequest.current = controller;
    try {
      const response = await fetch(`/api/appointment-slots?date=${encodeURIComponent(date)}`, { signal: controller.signal, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Appointment times could not be loaded.");
      setSlots(result.slots || []);
    } catch (cause) {
      if (!controller.signal.aborted) setSlotError(cause instanceof Error ? cause.message : "Appointment times could not be loaded.");
    } finally {
      if (!controller.signal.aborted) setSlotLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (!selectedSlot) { setError("Choose an available appointment time."); return; }
    const nowInIndia = Date.now() + 330 * 60_000;
    const earliest = new Date(nowInIndia).toISOString().slice(0, 10);
    const latest = new Date(nowInIndia + 365 * 86_400_000).toISOString().slice(0, 10);
    if (preferredDate < earliest || preferredDate > latest) { setError("Please choose a date within the next 12 months."); return; }

    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedLabel = slotLabel(slots.find(slot => slot.id === selectedSlot)?.startTime || "");
    try {
      const response = await fetch("/api/appointment-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: data.get("patientName"), mobile: data.get("mobile"), email: data.get("email"),
          ageGroup: data.get("ageGroup"), patientType: data.get("patientType"),
          slotId: selectedSlot, reason: data.get("reason"), consent: data.get("consent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.accepted) {
        setError(result.error || "Your request could not be saved. Please call or WhatsApp the clinic.");
        if (response.status === 409) await loadSlots(preferredDate);
        return;
      }
      setBookedLabel(`${preferredDate} · ${selectedLabel}`);
      setSubmitted(true);
      form.reset();
    } catch {
      setError("The connection failed. Please try again or contact the clinic by phone or WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <div className="appointment-success" role="status" aria-live="polite"><span>Request received</span><h2>Your appointment slot has been reserved.</h2><p>{bookedLabel}. The clinic will contact you to confirm your visit and payment details. No online payment has been taken.</p><button type="button" onClick={() => { setSubmitted(false); setPreferredDate(""); setSlots([]); setSelectedSlot(""); }}>Submit another request</button></div>;

  return <form className="appointment-form" onSubmit={submit}>
    <div className="form-intro"><h2 id="appointment-form-title">Request an appointment</h2><p>Choose a date and an available half-hour time (IST). The clinic will contact you to confirm your visit.</p></div>
    <div className="field-grid">
      <label><span>Patient name *</span><input name="patientName" autoComplete="name" minLength={2} maxLength={120} required placeholder="Full name"/></label>
      <label><span>Mobile number *</span><input name="mobile" type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[- ]?)?[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" required placeholder="10-digit mobile number"/></label>
      <label><span>Email <small>Optional</small></span><input name="email" type="email" autoComplete="email" maxLength={254} placeholder="name@example.com"/></label>
      <label><span>Age group *</span><select name="ageGroup" required defaultValue=""><option value="" disabled>Select age group</option><option>18–29 years</option><option>30–44 years</option><option>45–59 years</option><option>60–74 years</option><option>75 years or above</option></select></label>
      <label><span>Patient type *</span><select name="patientType" required defaultValue=""><option value="" disabled>Select patient type</option><option>New patient</option><option>Follow-up patient</option></select></label>
      <label><span>Preferred date *</span><input name="preferredDate" type="date" min={dateBounds.min} max={dateBounds.max} value={preferredDate} onChange={event => loadSlots(event.target.value)} required/></label>
      <div className="field-wide appointment-time-field" role="group" aria-label="Available appointment times"><strong>Preferred time *</strong>{!preferredDate ? <p>Choose a date to see available times.</p> : slotLoading ? <p role="status">Loading available times…</p> : slotError ? <p className="appointment-slot-error" role="alert">{slotError} <button type="button" onClick={() => loadSlots(preferredDate)}>Try again</button></p> : slots.length === 0 ? <p>No appointment times are open for this date. Please choose another date.</p> : <div className="appointment-slot-grid">{slots.map(slot => <button key={slot.id} type="button" className={`appointment-slot${selectedSlot === slot.id ? " selected" : ""}`} onClick={() => setSelectedSlot(slot.id)} aria-pressed={selectedSlot === slot.id}><span aria-hidden="true"/> {slotLabel(slot.startTime)}</button>)}</div>}</div>
      <label className="field-wide"><span>Broad reason for consultation *</span><select name="reason" required defaultValue=""><option value="" disabled>Select a broad reason</option>{reasons.map(reason => <option key={reason}>{reason}</option>)}</select><small>Please do not enter detailed medical history in this form.</small></label>
    </div>
    <label className="consent-field"><input name="consent" type="checkbox" required/><span>I consent to the clinic using these details to respond to my request. I understand this is not an emergency service. *</span></label>
    {error && <p className="appointment-form-error" role="alert">{error} <a href="tel:+919205775932">Call the clinic</a> or <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">message on WhatsApp</a>.</p>}
    <button className="submit-appointment" type="submit" disabled={submitting || !selectedSlot}>{submitting ? "Reserving slot…" : "Request appointment"}<span aria-hidden="true">→</span></button>
    <p className="form-security-note">The clinic will confirm your visit. <Link href="/policies#privacy">How your details are used</Link>.</p>
  </form>;
}
