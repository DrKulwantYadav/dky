"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCampConfig } from "@/lib/camps/contracts";
import { campDate, campTime } from "@/lib/camps/format";
import { StatusBadge } from "./StatusBadge";

type Filters = { campId: string; sessionId: string; slotId: string; registrationStatus: string; attendanceStatus: string; page: number };
type Row = { id: string; camp_id: string; camp_session_id: string | null; camp_slot_id: string | null; participant_name: string | null; full_name: string; phone: string;
  camp_name: string; session_date: string | null; start_time: string | null; end_time: string | null; token: string | null; booking_reference: string | null;
  registration_status: string; attendance_status: string; confirmation_status: string; notification_status: string; created_at: string };
type CampOption = { id: string; title: string };
const validId = (value: string | undefined) => value && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(value) ? value : "";
const indiaTime = (value: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function CampRegistrationExplorer({ initial, canManage }: { initial: Record<string, string | undefined>; canManage: boolean }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({ campId: validId(initial.camp) || "", sessionId: validId(initial.session) || "", slotId: validId(initial.slot) || "",
    registrationStatus: ["New","Registered","Cancelled"].includes(initial.registration || "") ? initial.registration! : "",
    attendanceStatus: ["Pending","Attended","No-show","Cancelled"].includes(initial.attendance || "") ? initial.attendance! : "", page: Math.max(1, Number(initial.page) || 1) });
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [camps, setCamps] = useState<CampOption[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<AdminCampConfig | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [moveRow, setMoveRow] = useState<Row | null>(null);
  const [moveCamp, setMoveCamp] = useState<AdminCampConfig | null>(null);
  const [destination, setDestination] = useState("");
  const [nowIndia] = useState(() => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 16));

  const urlFor = (next: Filters) => {
    const query = new URLSearchParams();
    if (next.campId) query.set("camp", next.campId);
    if (next.sessionId) query.set("session", next.sessionId);
    if (next.slotId) query.set("slot", next.slotId);
    if (next.registrationStatus) query.set("registration", next.registrationStatus);
    if (next.attendanceStatus) query.set("attendance", next.attendanceStatus);
    if (next.page > 1) query.set("page", String(next.page));
    return `/admin/free-camp-registrations${query.size ? `?${query}` : ""}`;
  };
  function change(update: Partial<Filters>) {
    const next = { ...filters, ...update };
    setLoading(true);
    setFilters(next);
    router.replace(urlFor(next), { scroll: false });
  }
  const payload = useMemo(() => ({ campId: filters.campId || null, sessionId: filters.sessionId || null, slotId: filters.slotId || null,
    registrationStatus: filters.registrationStatus || null, attendanceStatus: filters.attendanceStatus || null, search: submittedSearch,
    page: filters.page, size: 20 }), [filters, submittedSearch]);

  const loadRows = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/camp-registrations/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store", signal });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.rows)) throw new Error(result.error || "Registrations could not be loaded.");
      setRows(result.rows);
      setTotal(Number(result.total) || 0);
      setError("");
    } catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Registrations could not be loaded."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [payload]);
  useEffect(() => { const controller = new AbortController(); void Promise.resolve().then(() => loadRows(controller.signal)); return () => controller.abort(); }, [loadRows]);
  useEffect(() => {
    void fetch("/api/admin/camps", { cache: "no-store" }).then(response => response.json()).then(result => { if (Array.isArray(result.camps)) setCamps(result.camps); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!filters.campId) return;
    const controller = new AbortController();
    void fetch(`/api/admin/camps/${filters.campId}`, { cache: "no-store", signal: controller.signal }).then(response => response.json()).then(result => { if (!controller.signal.aborted) setSelectedCamp(result.camp || null); }).catch(() => {});
    return () => controller.abort();
  }, [filters.campId]);

  const sessions = selectedCamp?.sessions || [];
  const slots = sessions.find(item => item.id === filters.sessionId)?.slots || [];
  const pages = Math.max(1, Math.ceil(total / 20));
  async function action(row: Row, kind: "attend" | "no_show" | "cancel" | "move", destinationSlotId: string | null = null) {
    const explanations = { attend: "Mark this attendee as attended?", no_show: "Mark this attendee as a no-show?", cancel: "Cancel this registration? Its capacity will be released; other tokens will not change.", move: "Move this attendee? The destination slot will receive a new token while the booking reference and history remain." };
    if (!window.confirm(explanations[kind])) return;
    setBusy(row.id); setError("");
    try {
      const response = await fetch("/api/admin/camp-registrations/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, action: kind, destinationSlotId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Change could not be saved.");
      setMoveRow(null); setDestination("");
      await loadRows();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Change could not be saved."); }
    finally { setBusy(""); }
  }

  async function openMove(row: Row) {
    setMoveRow(row); setDestination(""); setMoveCamp(null);
    try {
      const response = await fetch(`/api/admin/camps/${row.camp_id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Available slots could not be loaded.");
      setMoveCamp(result.camp);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Available slots could not be loaded."); }
  }

  async function resend(row: Row) {
    if (!window.confirm("Queue another confirmation? Resends are limited and delivery may remain pending until WhatsApp is configured.")) return;
    setBusy(row.id); setError("");
    try {
      const response = await fetch("/api/admin/camp-registrations/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Confirmation could not be queued.");
      await loadRows();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Confirmation could not be queued."); }
    finally { setBusy(""); }
  }

  async function exportRows() {
    setBusy("export"); setError("");
    try {
      const response = await fetch("/api/admin/camp-registrations/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, page: undefined, size: undefined }) });
      if (!response.ok) throw new Error(await response.text());
      const href = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = href; link.download = "camp-registrations.csv"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Export failed."); }
    finally { setBusy(""); }
  }

  return <><div className="admin-page-heading"><div><p>Patient CRM</p><h1>Free camp registrations</h1><span>Filter every camp, session and arrival window. Totals and CSV include all matching records.</span></div><div className="admin-page-actions"><button className="admin-secondary-button" type="button" disabled={busy === "export"} onClick={() => void exportRows()}>{busy === "export" ? "Preparing CSV…" : "Export filtered CSV"}</button></div></div>
    <div className="admin-filters camp-registration-filters"><label>Camp<select value={filters.campId} onChange={event => { setSelectedCamp(null); change({ campId: event.target.value, sessionId: "", slotId: "", page: 1 }); }}><option value="">All camps</option>{camps.map(camp => <option key={camp.id} value={camp.id}>{camp.title}</option>)}</select></label><label>Session date<select value={filters.sessionId} onChange={event => change({ sessionId: event.target.value, slotId: "", page: 1 })} disabled={!filters.campId}><option value="">All dates</option>{sessions.map(session => <option key={session.id} value={session.id}>{campDate(session.date)}</option>)}</select></label><label>Arrival window<select value={filters.slotId} onChange={event => change({ slotId: event.target.value, page: 1 })} disabled={!filters.sessionId}><option value="">All windows</option>{slots.map(slot => <option key={slot.id} value={slot.id}>{campTime(slot.startTime)}–{campTime(slot.endTime)}</option>)}</select></label><label>Registration<select value={filters.registrationStatus} onChange={event => change({ registrationStatus: event.target.value, page: 1 })}><option value="">All statuses</option><option>New</option><option>Registered</option><option>Cancelled</option></select></label><label>Attendance<select value={filters.attendanceStatus} onChange={event => change({ attendanceStatus: event.target.value, page: 1 })}><option value="">All statuses</option><option>Pending</option><option>Attended</option><option>No-show</option><option>Cancelled</option></select></label><form onSubmit={event => { event.preventDefault(); setSubmittedSearch(search.trim()); change({ page: 1 }); }}><label>Attendee, mobile or token<input value={search} onChange={event => setSearch(event.target.value)} maxLength={120} autoComplete="off" placeholder="Private search" /></label><button type="submit">Search</button></form><button type="button" onClick={() => { setSearch(""); setSubmittedSearch(""); setSelectedCamp(null); change({ campId: "", sessionId: "", slotId: "", registrationStatus: "", attendanceStatus: "", page: 1 }); }}>Clear filters</button></div>
    {error && <div className="admin-alert error" role="alert">{error}</div>}{!error && <p className="camp-registration-total">{loading ? "Loading…" : `${total} matching registration${total === 1 ? "" : "s"}`} · Page {filters.page} of {pages}</p>}
    <div className="admin-table-wrap">{loading ? <div className="admin-empty" role="status">Loading registrations…</div> : error ? <div className="admin-empty">Registrations are unavailable until the database query succeeds.</div> : rows.length === 0 ? <div className="admin-empty">No registrations match these filters.</div> : <table className="admin-table camp-registration-table"><thead><tr><th>Attendee</th><th>Mobile</th><th>Camp</th><th>Session / arrival</th><th>Token / reference</th><th>Registration</th><th>Attendance</th><th>Created</th><th>Notification</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.participant_name || row.full_name}</strong></td><td>{row.phone}</td><td>{row.camp_name}</td><td>{row.session_date ? campDate(row.session_date, true) : "—"}<small>{row.start_time && row.end_time ? `${campTime(row.start_time)}–${campTime(row.end_time)}` : "No window"}</small></td><td>{row.token || "—"}<small>{row.booking_reference || "No reference"}</small></td><td><StatusBadge value={row.registration_status} /></td><td><StatusBadge value={row.attendance_status} /></td><td>{indiaTime(row.created_at)}</td><td>{row.notification_status || "Not Sent"}<small>{row.confirmation_status}</small></td><td>{canManage ? <div className="camp-registration-actions"><button disabled={busy === row.id || row.registration_status === "Cancelled"} onClick={() => void action(row, "attend")}>Check in</button><button disabled={busy === row.id || row.registration_status === "Cancelled"} onClick={() => void action(row, "no_show")}>No-show</button><button disabled={busy === row.id || row.registration_status === "Cancelled"} onClick={() => void action(row, "cancel")}>Cancel</button><button disabled={busy === row.id || row.registration_status === "Cancelled"} onClick={() => void openMove(row)}>Move</button><button disabled={busy === row.id || row.registration_status === "Cancelled" || !row.camp_slot_id} onClick={() => void resend(row)}>Resend confirmation</button></div> : "View only"}</td></tr>)}</tbody></table>}</div>
    <nav className="admin-pagination"><button type="button" disabled={filters.page <= 1} onClick={() => { setLoading(true); change({ page: filters.page - 1 }); }}>Previous</button><span>Page {filters.page} of {pages}</span><button type="button" disabled={filters.page >= pages} onClick={() => { setLoading(true); change({ page: filters.page + 1 }); }}>Next</button></nav>
    {moveRow && <div className="camp-move-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="camp-move-title" className="camp-move-dialog"><h2 id="camp-move-title">Move registration</h2><p>The original booking stays intact if the destination is unavailable. A successful move issues a new token and records the change.</p><label>Destination arrival window<select value={destination} onChange={event => setDestination(event.target.value)}><option value="">Choose available window</option>{moveCamp?.sessions.flatMap(session => session.slots.filter(slot => slot.active && slot.id !== moveRow.camp_slot_id && slot.capacity > (slot.bookedCount || 0) && session.active && `${session.date}T${slot.startTime.slice(0, 5)}` > nowIndia).map(slot => <option key={slot.id} value={slot.id}>{campDate(session.date, true)} · {campTime(slot.startTime)}–{campTime(slot.endTime)} · {slot.capacity - (slot.bookedCount || 0)} left</option>))}</select></label><div><button type="button" disabled={!destination || busy === moveRow.id} onClick={() => void action(moveRow, "move", destination)}>Move registration</button><button type="button" onClick={() => setMoveRow(null)}>Cancel</button></div></section></div>}
  </>;
}
