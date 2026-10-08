"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { APPOINTMENT_CAPACITY, minutesToTime, slotLabel } from "@/lib/appointment-slots";

export type AdminSlot = { slot_id: string; slot_date: string; start_time: string; is_open: boolean; booked_count: number };
const weekdays = [{ day: 1, label: "Mon" }, { day: 2, label: "Tue" }, { day: 3, label: "Wed" }, { day: 4, label: "Thu" }, { day: 5, label: "Fri" }, { day: 6, label: "Sat" }, { day: 0, label: "Sun" }];
const startTimes = Array.from({ length: 28 }, (_, index) => minutesToTime(480 + index * 30));
const endTimes = Array.from({ length: 28 }, (_, index) => minutesToTime(510 + index * 30));

export default function AppointmentSlotManager({ slots, fromDate, toDate, canManage }: { slots: AdminSlot[]; fromDate: string; toDate: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const groups = [...new Set(slots.map(slot => slot.slot_date))];

  async function openSlots(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/appointment-slots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        startDate: data.get("startDate"), endDate: data.get("endDate"), from: data.get("from"), to: data.get("to"), weekdays: selectedDays,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not open slots.");
      setMessage(`${result.opened} half-hour slots are open. Patients can now choose available times.`);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open slots."); }
    finally { setBusy(false); }
  }

  async function setOpen(id: string, isOpen: boolean) {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/appointment-slots", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id], isOpen }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update the slot.");
      setMessage(isOpen ? "Slot opened." : "Slot closed. Existing patient requests remain in the dashboard.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the slot."); }
    finally { setBusy(false); }
  }

  return <>
    {canManage && <section className="admin-panel slot-creator"><div><h2>Open clinic hours</h2><p>Choose a date or range, weekdays, and sitting hours. Times are created every 30 minutes from 8:00 am to 10:00 pm. Each time accepts up to four requests.</p></div><form onSubmit={openSlots} className="slot-creator-form"><label>From date<input name="startDate" type="date" defaultValue={fromDate} required/></label><label>To date<input name="endDate" type="date" defaultValue={toDate} required/></label><label>Start time<select name="from" defaultValue="17:30">{startTimes.map(time => <option key={time} value={time}>{slotLabel(time).split(" – ")[0]}</option>)}</select></label><label>End time<select name="to" defaultValue="20:00">{endTimes.map(time => <option key={time} value={time}>{slotLabel(minutesToTime(Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) - 30)).split(" – ")[1]}</option>)}</select></label><fieldset><legend>Days to open</legend><div>{weekdays.map(({ day, label }) => <label key={day}><input type="checkbox" checked={selectedDays.includes(day)} onChange={() => setSelectedDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day])}/>{label}</label>)}</div></fieldset><button type="submit" disabled={busy || !selectedDays.length}>{busy ? "Saving…" : "Open selected slots"}</button></form></section>}
    {error && <p className="admin-alert error" role="alert">{error}</p>}{message && <p className="admin-alert slot-success" role="status">{message}</p>}
    <section className="slot-calendar"><div className="slot-calendar-heading"><h2>Appointment slots</h2><span>{fromDate} to {toDate}</span></div>{groups.length === 0 ? <div className="admin-empty"><strong>No slots in this date range</strong><p>Open sitting hours above, or choose another range.</p></div> : groups.map(date => <div className="slot-day" key={date}><h3>{new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</h3><div className="slot-day-grid">{slots.filter(slot => slot.slot_date === date).map(slot => <article key={slot.slot_id} className={`slot-admin-card${slot.is_open ? " open" : " closed"}`}><strong>{slotLabel(slot.start_time)}</strong><span>{slot.booked_count} / {APPOINTMENT_CAPACITY} booked</span><small>{slot.is_open ? slot.booked_count >= APPOINTMENT_CAPACITY ? "Full" : "Open to patients" : "Closed"}</small>{canManage && <button type="button" disabled={busy} onClick={() => setOpen(slot.slot_id, !slot.is_open)}>{slot.is_open ? "Close" : "Open"}</button>}</article>)}</div></div>)}</section>
  </>;
}
