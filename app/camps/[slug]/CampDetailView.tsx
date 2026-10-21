"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CampApiError, CampAvailabilityResponse, CampBookingConfirmation, CampBookingRequest, CampBookingSuccess, CampDetail, CampDetailResponse, CampSession } from "@/lib/camps/contracts";
import { campDate, campTime } from "@/lib/camps/format";

type ViewState = "loading" | "ready" | "missing" | "error";
type SubmitState = "idle" | "submitting" | "failed" | "uncertain";

function isConfirmation(value: unknown): value is CampBookingSuccess {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<CampBookingSuccess>;
  const confirmation = result.confirmation;
  return result.status === "confirmed" && !!confirmation &&
    [confirmation.campName, confirmation.date, confirmation.arrivalStartTime, confirmation.arrivalEndTime, confirmation.token, confirmation.venueName, confirmation.venueAddress, confirmation.bookingReference].every(item => typeof item === "string" && item.length > 0);
}

function Confirmation({ details, onNewBooking }: { details: CampBookingConfirmation; onNewBooking: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `${details.campName}\nDate: ${campDate(details.date)}\nArrival window: ${campTime(details.arrivalStartTime)} – ${campTime(details.arrivalEndTime)} IST\nToken: ${details.token}\nVenue: ${details.venueName}, ${details.venueAddress}\nBooking reference: ${details.bookingReference}`;
  return <section className="camp-confirmation" role="status" aria-live="polite"><p className="eyebrow"><span /> Registration confirmed</p><h1>Your place is confirmed.</h1><p>Save these details and bring your token to the camp.</p><dl><div><dt>Camp</dt><dd>{details.campName}</dd></div><div><dt>Date</dt><dd>{campDate(details.date)}</dd></div><div><dt>Arrival window</dt><dd>{campTime(details.arrivalStartTime)} – {campTime(details.arrivalEndTime)} IST</dd></div><div><dt>Queue token</dt><dd className="camp-token">{details.token}</dd></div><div><dt>Venue</dt><dd>{details.venueName}, {details.venueAddress}</dd></div><div><dt>Booking reference</dt><dd>{details.bookingReference}</dd></div></dl><p>The arrival window tells you when to come. Your token gives your queue position within that window.</p><div className="camp-confirmation-actions"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } }}>{copied ? "Details copied" : "Copy details"}</button><button type="button" onClick={() => window.print()}>Print / save as PDF</button><button type="button" onClick={onNewBooking}>Register another person</button></div><p className="camp-private-note">Keep these details for your visit. A token or reference does not provide access to patient information.</p></section>;
}

export default function CampDetailView({ slug }: { slug: string }) {
  const [camp, setCamp] = useState<CampDetail | null>(null);
  const [state, setState] = useState<ViewState>("loading");
  const [sessionId, setSessionId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [patientName, setPatientName] = useState("");
  const [mobile, setMobile] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState<CampBookingConfirmation | null>(null);
  const pending = useRef<CampBookingRequest | null>(null);
  const inFlight = useRef(false);
  const pendingStorageKey = `camp-booking-attempt:${slug}`;

  const refreshAvailability = useCallback(async (currentCamp: CampDetail, preserveSelection = true) => {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      const response = await fetch(`/api/camps/${encodeURIComponent(slug)}/availability`, { cache: "no-store" });
      if (!response.ok) throw new Error("Current availability could not be checked.");
      const result: CampAvailabilityResponse = await response.json();
      if (!Array.isArray(result.sessions)) throw new Error("Invalid availability response.");
      setCamp({ ...currentCamp, sessions: result.sessions });
      if (!preserveSelection) setSlotId("");
      return true;
    } catch {
      setAvailabilityError("Current availability could not be checked. Please retry before registering.");
      return false;
    } finally { setAvailabilityLoading(false); }
  }, [slug]);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/camps/${encodeURIComponent(slug)}`, { cache: "no-store", signal });
      if (response.status === 404) { setState("missing"); return; }
      if (!response.ok) throw new Error("Camp details unavailable.");
      const result: CampDetailResponse = await response.json();
      if (!result.camp || !Array.isArray(result.camp.sessions) || result.camp.slug !== slug) throw new Error("Invalid camp response.");
      setCamp(result.camp);
      setState("ready");
    } catch { if (!signal?.aborted) setState("error"); }
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    try {
      const saved = sessionStorage.getItem(pendingStorageKey);
      if (saved) {
        const request = JSON.parse(saved) as CampBookingRequest;
        if (request.submissionKey && request.campId && request.sessionId && request.slotId && request.patientName && request.mobile && request.consent === true) {
          queueMicrotask(() => {
            if (controller.signal.aborted) return;
            pending.current = request;
            setSessionId(request.sessionId);
            setSlotId(request.slotId);
            setPatientName(request.patientName);
            setMobile(request.mobile);
            setConsent(true);
            setSubmitState("uncertain");
            setSubmitError("A previous booking attempt may have succeeded. Retry safely to retrieve its result.");
          });
        }
      }
    } catch { sessionStorage.removeItem(pendingStorageKey); }
    return () => controller.abort();
  }, [load, pendingStorageKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!camp || inFlight.current || !sessionId || !slotId || !consent) return;
    inFlight.current = true;
    setSubmitState("submitting");
    setSubmitError("");
    try {
      if (!pending.current) {
        let availability: CampAvailabilityResponse;
        try {
          const availabilityResponse = await fetch(`/api/camps/${encodeURIComponent(slug)}/availability`, { cache: "no-store" });
          if (!availabilityResponse.ok) throw new Error("availability");
          availability = await availabilityResponse.json();
          if (!Array.isArray(availability.sessions)) throw new Error("availability");
        } catch {
          setSubmitState("failed");
          setAvailabilityError("Current availability could not be checked. Please retry before registering.");
          return;
        }
        setCamp({ ...camp, sessions: availability.sessions });
        const freshSlot = availability.sessions.find(item => item.id === sessionId)?.slots.find(item => item.id === slotId);
        if (!freshSlot || freshSlot.status !== "open" || freshSlot.remaining < 1) {
          setSlotId("");
          setSubmitState("failed");
          setSubmitError("This arrival window is no longer available. Please choose another time.");
          return;
        }
      }
      // An uncertain attempt must replay the exact same payload and key.
      const request: CampBookingRequest = pending.current ?? { campId: camp.id, sessionId, slotId, patientName: patientName.trim(), mobile: mobile.trim(), consent: true, submissionKey: crypto.randomUUID() };
      pending.current = request;
      sessionStorage.setItem(pendingStorageKey, JSON.stringify(request));
      const response = await fetch(`/api/camps/${encodeURIComponent(slug)}/bookings`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": request.submissionKey }, body: JSON.stringify(request), cache: "no-store" });
      let result: unknown;
      try { result = await response.json(); } catch { throw new Error("uncertain"); }
      if (response.ok) {
        if (!isConfirmation(result)) throw new Error("uncertain");
        pending.current = null;
        sessionStorage.removeItem(pendingStorageKey);
        setConfirmation(result.confirmation);
        return;
      }
      const apiError = result as Partial<CampApiError>;
      const message = apiError.error?.message || "Registration could not be completed. Please check the details and try again.";
      if (response.status >= 500 || response.status === 429 || response.status === 408) throw new Error("uncertain");
      pending.current = null;
      sessionStorage.removeItem(pendingStorageKey);
      setSubmitState("failed");
      setSubmitError(message);
      if (apiError.error?.code === "SLOT_FULL" || apiError.error?.code === "SLOT_CLOSED") await refreshAvailability(camp, false);
    } catch {
      setSubmitState("uncertain");
      setSubmitError("We could not confirm the result. Retry safely with the same booking details; please do not start a new booking yet.");
    } finally { inFlight.current = false; setSubmitState(current => current === "submitting" ? "idle" : current); }
  }

  if (state === "loading") return <section className="camps-state camps-route-state" role="status">Loading camp details…</section>;
  if (state === "missing") return <section className="camps-state camps-route-state"><h1>Camp not found</h1><p>This camp is unavailable or has not been published.</p><Link href="/camps">Browse health camps →</Link></section>;
  if (state === "error" || !camp) return <section className="camps-state camps-route-state" role="alert"><h1>Camp details unavailable</h1><p>Please try again in a moment.</p><button type="button" onClick={() => { setState("loading"); void load(); }}>Retry</button></section>;
  if (confirmation) return <Confirmation details={confirmation} onNewBooking={() => { setConfirmation(null); setPatientName(""); setMobile(""); setConsent(false); setSessionId(""); setSlotId(""); setSubmitState("idle"); pending.current = null; sessionStorage.removeItem(pendingStorageKey); void refreshAvailability(camp, false); }} />;

  const session: CampSession | undefined = camp.sessions.find(item => item.id === sessionId);
  const slots = session?.slots ?? [];
  const locked = submitState === "uncertain" || submitState === "submitting";
  const canBook = submitState === "uncertain" || camp.status === "open";
  return <>
    <section className="camp-detail-hero"><div><Link className="back-link" href="/camps">← All health camps</Link><p className="eyebrow"><span /> Health camp</p><h1>{camp.title}</h1><p>{camp.description}</p><span className={`camp-status camp-status-${camp.status}`}>{camp.status === "open" ? "Registration open" : camp.status === "upcoming" ? "Registration coming soon" : camp.status === "full" ? "Fully booked" : "Registration closed"}</span></div>{camp.imageUrl && <Image src={camp.imageUrl} alt="" width={900} height={600} unoptimized />}</section>
    <div className="camp-detail-layout"><section className="camp-information" aria-labelledby="camp-info-title"><h2 id="camp-info-title">Plan your visit</h2><dl><div><dt>Venue</dt><dd>{camp.venueName}<br />{camp.venueAddress}</dd></div><div><dt>Operating hours</dt><dd>{camp.sessions.map(item => <span className="camp-session-line" key={item.id}>{campDate(item.date)} · {campTime(item.opensAt)} – {campTime(item.closesAt)} IST</span>)}</dd></div></dl>{camp.instructions.length > 0 && <><h3>Before you arrive</h3><ul>{camp.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ul></>}<p className="camp-arrival-note">Your chosen time is an arrival window. The token gives your queue position within that window.</p></section>
    <section className="camp-form-panel" id="register" aria-labelledby="camp-form-title"><h2 id="camp-form-title">Register for this camp</h2><p>Register each attendee separately. Family members may use the same contact number; enter the name of the person attending each time.</p>{!canBook ? <div className="camps-state"><p>{camp.status === "full" ? "All available windows are full." : camp.status === "upcoming" ? "Registration has not opened yet." : "Registration is closed for this camp."}</p></div> : <form onSubmit={submit}>
      <label>Patient name <input value={patientName} onChange={event => setPatientName(event.target.value)} autoComplete="name" minLength={2} maxLength={120} placeholder="Name of person attending" disabled={locked} required /></label>
      <label>Mobile number <input value={mobile} onChange={event => setMobile(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[- ]?)?[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" placeholder="10-digit mobile number" disabled={locked} required /></label>
      <label>Session date <select value={sessionId} onChange={event => { setSessionId(event.target.value); setSlotId(""); setSubmitError(""); }} disabled={locked} required><option value="">Choose a date</option>{camp.sessions.map(item => <option key={item.id} value={item.id}>{campDate(item.date)} · {campTime(item.opensAt)} – {campTime(item.closesAt)}</option>)}</select></label>
      <fieldset disabled={locked || !sessionId}><legend>Arrival window</legend>{!sessionId ? <p>Choose a date to see arrival windows.</p> : slots.length === 0 ? <p>No arrival windows are available for this date.</p> : <div className="camp-slot-grid">{slots.map(slot => <label className={slot.id === slotId ? "selected" : ""} key={slot.id}><input type="radio" name="slot" value={slot.id} checked={slotId === slot.id} onChange={() => setSlotId(slot.id)} disabled={slot.status !== "open" || slot.remaining < 1} required /><span>{campTime(slot.startTime)} – {campTime(slot.endTime)}<small>{slot.status === "closed" ? "Closed" : slot.status === "full" || slot.remaining < 1 ? "Full" : "Available"}</small></span></label>)}</div>}</fieldset>
      <label className="camp-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={locked} required /><span>I consent to the clinic using these details to register and contact this attendee about the camp.</span></label>
      {availabilityLoading && <p role="status">Refreshing availability…</p>}{availabilityError && <p className="camp-form-error" role="alert">{availabilityError} <button type="button" onClick={() => void refreshAvailability(camp)}>Try again</button></p>}{submitError && <p className="camp-form-error" role="alert">{submitError}</p>}
      <button className="camp-submit" type="submit" disabled={submitState === "submitting" || availabilityLoading || !!availabilityError || !slotId}>{submitState === "submitting" ? "Checking registration…" : submitState === "uncertain" ? "Retry same booking safely" : "Confirm free registration"}</button><p className="camp-private-note">Availability is checked again when you submit. No payment is required. <a href="/policies#privacy">Privacy information</a></p>
    </form>}</section></div>
  </>;
}
