"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { generateCampSlots, validateCampConfig } from "@/lib/camps/admin-validation";
import type { AdminCampConfig, AdminCampSession, AdminCampSlot } from "@/lib/camps/contracts";

const emptySession = (): AdminCampSession => ({ date: "", startTime: "09:00", endTime: "13:00", active: true, slotDurationMinutes: 30, capacityPerSlot: 10, breaks: [], slots: [] });
const emptyCamp = (): AdminCampConfig => ({ title: "", slug: "", description: "", instructions: [], venueName: "", venueAddress: "", imageUrl: null, tokenPrefix: "",
  lifecycle: "draft", registrationOpensAt: null, registrationClosesAt: null, datesReviewed: false, sessions: [emptySession()] });
const localTime = (value: string | null) => value ? new Date(Date.parse(value) + 330 * 60_000).toISOString().slice(0, 16) : "";
const isoTime = (value: string) => value ? `${value}:00+05:30` : null;
const trimTime = (value: string) => value.slice(0, 5);

function normalizeCamp(value: AdminCampConfig): AdminCampConfig {
  return { ...value, tokenPrefix: value.tokenPrefix || "", instructions: value.instructions || [], sessions: value.sessions.map(session => ({ ...session,
    startTime: trimTime(session.startTime), endTime: trimTime(session.endTime), breaks: (session.breaks || []).map(item => ({ startTime: trimTime(item.startTime), endTime: trimTime(item.endTime) })),
    slots: (session.slots || []).map(slot => ({ ...slot, startTime: trimTime(slot.startTime), endTime: trimTime(slot.endTime) })) })) };
}

export default function CampEditor({ id, canManage }: { id?: string; canManage: boolean }) {
  const [camp, setCamp] = useState<AdminCampConfig>(() => emptyCamp());
  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [needsPreview, setNeedsPreview] = useState<number[]>(id ? [] : [0]);
  const [instructionsText, setInstructionsText] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/admin/camps/${id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Camp could not be loaded.");
      const loaded = normalizeCamp(result.camp as AdminCampConfig);
      setCamp(loaded);
      setInstructionsText(loaded.instructions.join("\n"));
      setLoadError("");
    } catch (cause) { setLoadError(cause instanceof Error ? cause.message : "Camp could not be loaded."); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  function update<K extends keyof AdminCampConfig>(key: K, value: AdminCampConfig[K]) { setCamp(previous => ({ ...previous, [key]: value })); setError(""); }
  function updateSession(index: number, change: Partial<AdminCampSession>, settingsChanged = false) {
    setCamp(previous => ({ ...previous, datesReviewed: settingsChanged ? false : previous.datesReviewed,
      sessions: previous.sessions.map((session, i) => i === index ? { ...session, ...change } : session) }));
    if (settingsChanged) setNeedsPreview(previous => previous.includes(index) ? previous : [...previous, index]);
    setError("");
  }
  function updateSlot(sessionIndex: number, slotIndex: number, change: Partial<AdminCampSlot>) {
    setCamp(previous => ({ ...previous, datesReviewed: change.startTime || change.endTime ? false : previous.datesReviewed, sessions: previous.sessions.map((session, i) => i === sessionIndex ?
      { ...session, slots: session.slots.map((slot, j) => j === slotIndex ? { ...slot, ...change } : slot) } : session) }));
  }

  function preview(index: number) {
    try {
      const session = camp.sessions[index];
      const generated = generateCampSlots(session.startTime, session.endTime, session.slotDurationMinutes, session.capacityPerSlot, session.breaks);
      const merged = generated.map(slot => {
        const existing = session.slots.find(item => item.startTime === slot.startTime && item.endTime === slot.endTime);
        return existing ? { ...slot, ...existing } : slot;
      });
      // A booked window omitted by new settings is retained; the database also rejects its removal.
      for (const existing of session.slots.filter(item => (item.bookedCount || 0) > 0)) {
        if (!merged.some(item => item.id === existing.id)) merged.push(existing);
      }
      merged.sort((a, b) => a.startTime.localeCompare(b.startTime));
      updateSession(index, { slots: merged });
      setNeedsPreview(previous => previous.filter(item => item !== index));
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Slot preview could not be generated."); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || saving) return;
    const config: AdminCampConfig = { ...camp, instructions: instructionsText.split("\n").map(item => item.trim()).filter(Boolean) };
    const errors = validateCampConfig(config);
    if (needsPreview.length) errors.unshift("Generate and review the slot preview for each changed session before saving.");
    if (errors.length) { setError(errors.join(" ")); return; }
    if (config.lifecycle === "published" && !window.confirm("Publish this camp? Its link and bookable windows will become public after the Part 3 public backend is connected.")) return;
    if (config.lifecycle === "cancelled" && !window.confirm("Cancel this camp? Existing registrations remain in the record; contact affected patients separately.")) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(id ? `/api/admin/camps/${id}` : "/api/admin/camps", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Camp could not be saved.");
      window.location.href = `/admin/camps/${result.id}`;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Camp could not be saved."); setSaving(false); }
  }

  if (loading) return <div className="admin-panel" role="status">Loading camp…</div>;
  if (loadError) return <div className="admin-alert error" role="alert">{loadError} <button type="button" onClick={() => { setLoading(true); void load(); }}>Retry</button></div>;
  return <><div className="admin-page-heading"><div><p>Patient CRM</p><h1>{id ? "Edit Camp" : "Create Camp"}</h1><span>Save configuration and arrival windows together.</span></div><Link className="admin-secondary-button" href="/admin/camps">← All camps</Link></div>
    {!canManage && <div className="admin-alert error">Your staff role can view camps but cannot change them.</div>}
    <form className="camp-editor" onSubmit={event => void save(event)}><section className="admin-panel"><h2>Camp details</h2><div className="camp-editor-fields"><label>Camp title<input value={camp.title} onChange={event => update("title", event.target.value)} maxLength={160} disabled={!canManage} required /></label><label>Unique URL slug<input value={camp.slug} onChange={event => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} disabled={!canManage} required /><small>Public URL: /camps/{camp.slug || "your-camp-slug"}</small></label><label className="wide">Short description<textarea value={camp.description} onChange={event => update("description", event.target.value)} maxLength={2000} disabled={!canManage} required /></label><label className="wide">Registration instructions <small>One instruction per line</small><textarea value={instructionsText} onChange={event => setInstructionsText(event.target.value)} disabled={!canManage} /></label><label>Hospital / venue<input value={camp.venueName} onChange={event => update("venueName", event.target.value)} disabled={!canManage} required /></label><label>Address<input value={camp.venueAddress} onChange={event => update("venueAddress", event.target.value)} disabled={!canManage} required /></label><label>Queue token place code<input value={camp.tokenPrefix} onChange={event => update("tokenPrefix", event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))} maxLength={3} pattern="[A-Z]{3}" disabled={!canManage} required={camp.lifecycle === "published"} /><small>Three letters you choose, such as BHW. New bookings use CODE-11AM-001; existing tokens stay unchanged.</small></label><label className="wide">Image URL <small>Optional</small><input type="url" value={camp.imageUrl || ""} onChange={event => update("imageUrl", event.target.value || null)} disabled={!canManage} /></label></div></section>
    <section className="admin-panel"><h2>Publication and registration</h2><div className="camp-editor-fields"><label>Lifecycle<select value={camp.lifecycle} onChange={event => update("lifecycle", event.target.value as AdminCampConfig["lifecycle"])} disabled={!canManage}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed registration</option><option value="cancelled">Cancelled</option></select></label><span className="camp-editor-note">Publishing requires reviewed dates, registration times and an active future slot. Closing stops new registration without changing existing bookings.</span><label>Registration opens (IST)<input type="datetime-local" value={localTime(camp.registrationOpensAt)} onChange={event => update("registrationOpensAt", isoTime(event.target.value))} disabled={!canManage} /></label><label>Registration closes (IST)<input type="datetime-local" value={localTime(camp.registrationClosesAt)} onChange={event => update("registrationClosesAt", isoTime(event.target.value))} disabled={!canManage} /></label><label className="camp-editor-check wide"><input type="checkbox" checked={camp.datesReviewed} onChange={event => update("datesReviewed", event.target.checked)} disabled={!canManage} /><span>I have reviewed the session dates and arrival windows for this camp.</span></label></div></section>
    <section className="admin-panel">
      <div className="panel-title-row"><div><h2>Sessions and slots</h2><p>Generate a preview for each session, then adjust unbooked windows and capacities.</p></div>
        {canManage && <button type="button" className="admin-secondary-button" onClick={() => {
          const next = camp.sessions.length;
          setCamp(previous => ({ ...previous, sessions: [...previous.sessions, emptySession()], datesReviewed: false }));
          setNeedsPreview(previous => [...previous, next]);
        }}>Add session</button>}
      </div>
      {camp.sessions.map((session, index) => <article className="camp-editor-session" key={session.id || `new-${index}`}>
        <div className="panel-title-row"><h3>Session {index + 1}</h3>{canManage && camp.sessions.length > 1 && <button type="button" disabled={session.slots.some(slot => (slot.bookedCount || 0) > 0)} onClick={() => {
          setCamp(previous => ({ ...previous, sessions: previous.sessions.filter((_, i) => i !== index), datesReviewed: false }));
          setNeedsPreview(previous => previous.filter(i => i !== index).map(i => i > index ? i - 1 : i));
        }}>Remove session</button>}</div>
        <div className="camp-editor-fields">
          <label>Date<input type="date" value={session.date} onChange={event => updateSession(index, { date: event.target.value }, true)} disabled={!canManage || session.slots.some(slot => (slot.bookedCount || 0) > 0)} required /></label>
          <label>Active<select value={session.active ? "yes" : "no"} onChange={event => updateSession(index, { active: event.target.value === "yes" })} disabled={!canManage}><option value="yes">Active</option><option value="no">Inactive</option></select></label>
          <label>Start time<input type="time" value={session.startTime} onChange={event => updateSession(index, { startTime: event.target.value }, true)} disabled={!canManage || session.slots.some(slot => (slot.bookedCount || 0) > 0)} required /></label>
          <label>End time<input type="time" value={session.endTime} onChange={event => updateSession(index, { endTime: event.target.value }, true)} disabled={!canManage || session.slots.some(slot => (slot.bookedCount || 0) > 0)} required /></label>
          <label>Slot duration (minutes)<input type="number" min={5} max={240} value={session.slotDurationMinutes} onChange={event => updateSession(index, { slotDurationMinutes: Number(event.target.value) }, true)} disabled={!canManage} required /></label>
          <label>Default capacity per slot<input type="number" min={1} max={10000} value={session.capacityPerSlot} onChange={event => updateSession(index, { capacityPerSlot: Number(event.target.value) }, true)} disabled={!canManage} required /></label>
        </div>
        <div className="camp-breaks"><strong>Optional breaks</strong>
          {session.breaks.map((item, breakIndex) => <div key={breakIndex}>
            <label>From<input type="time" value={item.startTime} onChange={event => updateSession(index, { breaks: session.breaks.map((part, i) => i === breakIndex ? { ...part, startTime: event.target.value } : part) }, true)} disabled={!canManage} /></label>
            <label>To<input type="time" value={item.endTime} onChange={event => updateSession(index, { breaks: session.breaks.map((part, i) => i === breakIndex ? { ...part, endTime: event.target.value } : part) }, true)} disabled={!canManage} /></label>
            {canManage && <button type="button" onClick={() => updateSession(index, { breaks: session.breaks.filter((_, i) => i !== breakIndex) }, true)}>Remove break</button>}
          </div>)}
          {canManage && <button type="button" onClick={() => updateSession(index, { breaks: [...session.breaks, { startTime: "11:00", endTime: "11:30" }] }, true)}>Add break</button>}
        </div>
        {canManage && <button type="button" className="camp-generate" onClick={() => preview(index)}>Generate slot preview</button>}
        <div className="camp-editor-slots">{session.slots.length === 0 ? <p>No slots previewed yet.</p> : session.slots.map((slot, slotIndex) => <div key={slot.id || `${slot.startTime}-${slotIndex}`}>
          <label>From<input type="time" value={slot.startTime} onChange={event => updateSlot(index, slotIndex, { startTime: event.target.value })} disabled={!canManage || (slot.bookedCount || 0) > 0} /></label>
          <label>To<input type="time" value={slot.endTime} onChange={event => updateSlot(index, slotIndex, { endTime: event.target.value })} disabled={!canManage || (slot.bookedCount || 0) > 0} /></label>
          <label>Capacity<input type="number" min={Math.max(1, slot.bookedCount || 0)} value={slot.capacity} onChange={event => updateSlot(index, slotIndex, { capacity: Number(event.target.value) })} disabled={!canManage} /></label>
          <label>Active<input type="checkbox" checked={slot.active} onChange={event => updateSlot(index, slotIndex, { active: event.target.checked })} disabled={!canManage} /></label>
          <span>{slot.bookedCount || 0} booked</span>
          {canManage && <button type="button" disabled={(slot.bookedCount || 0) > 0} onClick={() => updateSession(index, { slots: session.slots.filter((_, i) => i !== slotIndex) })}>Remove</button>}
        </div>)}</div>
      </article>)}
    </section>
    {error && <div className="admin-alert error" role="alert">{error}</div>}{canManage && <button className="admin-primary-link camp-save" type="submit" disabled={saving || needsPreview.length > 0}>{saving ? "Saving…" : id ? "Save camp" : "Create camp"}</button>}<p className="camp-editor-note">Changes appear as saved only after the database confirms the transaction. Existing booked windows cannot be removed or rescheduled here.</p></form>
  </>;
}
