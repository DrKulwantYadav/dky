"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { campDateRange } from "@/lib/camps/format";
import type { AdminCampLifecycle } from "@/lib/camps/contracts";

type Row = { id: string; title: string; slug: string | null; description: string | null; venueName: string; venueAddress: string;
  lifecycle: AdminCampLifecycle; firstDate: string; lastDate: string; sessionCount: number; registrationCount: number;
  capacity: number; remainingUpcoming: number; sessions: { id: string; date: string; startTime: string; endTime: string; active: boolean }[] };

export default function CampOverview({ canManage }: { canManage: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [today] = useState(() => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10));

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/camps", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.camps)) throw new Error(result.error || "Camp overview could not be loaded.");
      setRows(result.camps);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Camp overview could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const filtered = useMemo(() => rows.filter(row =>
    (!search || `${row.title} ${row.venueName} ${row.slug ?? ""}`.toLowerCase().includes(search.toLowerCase())) &&
    (!lifecycle || row.lifecycle === lifecycle) &&
    (!dateFilter || (dateFilter === "upcoming" ? row.lastDate >= today : row.lastDate < today))), [rows, search, lifecycle, dateFilter, today]);
  const activeRegistrations = rows.reduce((total, row) => total + Number(row.registrationCount), 0);
  const remaining = rows.filter(row => row.lifecycle === "published" && row.lastDate >= today).reduce((total, row) => total + Number(row.remainingUpcoming), 0);
  const publishedUpcoming = rows.filter(row => row.lifecycle === "published" && row.lastDate >= today).length;

  async function duplicate(row: Row) {
    const slug = window.prompt("New unique URL slug for the draft copy. Review dates before publishing.", `${row.slug || "camp"}-copy`);
    if (!slug) return;
    setBusy(row.id); setActionError("");
    try {
      const response = await fetch(`/api/admin/camps/${row.id}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Camp could not be duplicated.");
      window.location.href = `/admin/camps/${result.id}`;
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Camp could not be duplicated."); setBusy(""); }
  }

  async function close(row: Row) {
    if (!window.confirm(`Close registration for “${row.title}”? Existing bookings stay confirmed and their schedules do not change.`)) return;
    setBusy(row.id); setActionError("");
    try {
      const saved = await fetch(`/api/admin/camps/${row.id}`, { method: "PATCH" });
      const outcome = await saved.json();
      if (!saved.ok) throw new Error(outcome.error || "Registration could not be closed.");
      await load();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Registration could not be closed."); }
    finally { setBusy(""); }
  }

  async function copyLink(row: Row) {
    if (!row.slug || row.lifecycle !== "published") return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/camps/${row.slug}`); setCopied(row.id); }
    catch { setActionError("Could not copy the URL. Open the camp preview and copy its address manually."); }
  }

  return <><div className="admin-page-heading"><div><p>Patient CRM</p><h1>Camps</h1><span>Configure reusable health camps and review availability.</span></div>{canManage && <Link className="admin-primary-link" href="/admin/camps/new">Create Camp</Link>}</div>
    <div className="camp-dependency-note">Camp links can be copied after publication. Public registration remains unavailable until the Part 3 booking API is connected.</div>
    {error && <div className="admin-alert error" role="alert">{error} <button type="button" onClick={() => { setLoading(true); void load(); }}>Retry</button></div>}
    {actionError && <div className="admin-alert error" role="alert">{actionError}</div>}
    {!loading && !error && <section className="camp-metrics" aria-label="Camp metrics"><article><span>Total camps</span><strong>{rows.length}</strong><small>Includes all lifecycle states and historical camps.</small></article><article><span>Published upcoming</span><strong>{publishedUpcoming}</strong><small>Published camps with an end date today or later.</small></article><article><span>Active registrations</span><strong>{activeRegistrations}</strong><small>All camps; excludes cancelled registrations.</small></article><article><span>Remaining capacity</span><strong>{remaining}</strong><small>Active future slots in published camps, less active bookings.</small></article></section>}
    <div className="admin-filters camp-overview-filters"><label>Search<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Title, venue or slug" /></label><label>Lifecycle<select value={lifecycle} onChange={event => setLifecycle(event.target.value)}><option value="">All states</option><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option></select></label><label>Dates<select value={dateFilter} onChange={event => setDateFilter(event.target.value)}><option value="">All dates</option><option value="upcoming">Current and upcoming</option><option value="past">Past</option></select></label></div>
    {loading ? <div className="admin-panel" role="status">Loading camps…</div> : error ? null : filtered.length === 0 ? <div className="admin-panel">No camps match these filters.</div> : <div className="camp-overview-grid">{filtered.map(row => <article className="admin-panel" key={row.id}><div className="panel-title-row"><div><h2>{row.title}</h2><p>{row.venueName} · {row.venueAddress}</p></div><span className={`camp-admin-status ${row.lifecycle}`}>{row.lifecycle}</span></div><p>{campDateRange(row.firstDate, row.lastDate)} · {row.sessionCount} session{row.sessionCount === 1 ? "" : "s"}</p><div className="camp-overview-counts"><span>Capacity <strong>{row.capacity}</strong></span><span>Active registrations <strong>{row.registrationCount}</strong></span><span>Future places <strong>{row.remainingUpcoming}</strong></span></div><div className="camp-overview-actions"><Link href={`/admin/camps/${row.id}`}>Edit</Link><Link href={`/admin/camps/${row.id}/preview`}>Preview</Link><Link href={`/admin/free-camp-registrations?camp=${row.id}`}>View Registrations</Link>{canManage && <><button type="button" disabled={busy === row.id || row.lifecycle !== "published"} onClick={() => void copyLink(row)}>{copied === row.id ? "Copied" : "Copy Link"}</button><button type="button" disabled={busy === row.id} onClick={() => void duplicate(row)}>Duplicate</button><button type="button" disabled={busy === row.id || row.lifecycle !== "published"} onClick={() => void close(row)}>Close Registration</button></>}</div></article>)}</div>}
  </>;
}
