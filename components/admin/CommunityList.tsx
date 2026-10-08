"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Initiative } from "@/lib/community";

async function request(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export default function CommunityList({ initial }: { initial: Initiative[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [year, setYear] = useState(""); const [topic, setTopic] = useState(""); const [sort, setSort] = useState("newest");
  const [busy, setBusy] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const years = [...new Set(items.map(x => x.start_date?.slice(0, 4)).filter((x): x is string => !!x))].sort().reverse();
  const topics = [...new Set(items.map(x => x.topic).filter(Boolean))].sort();
  const visible = useMemo(() => items.filter(x => x.title.toLowerCase().includes(q.toLowerCase()) && (!status || x.status === status) && (!year || x.start_date?.startsWith(year)) && (!topic || x.topic === topic)).sort((a, b) => sort === "event" ? (b.start_date || "").localeCompare(a.start_date || "") : b.created_at.localeCompare(a.created_at)), [items, q, status, year, topic, sort]);
  async function create() {
    const title = prompt("Initiative title");
    if (!title?.trim()) return;
    const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setBusy("create"); setError("");
    try { const created = await request("/api/admin/community", "POST", { title: title.trim(), slug }); router.push(`/admin/community/${created.id}`); }
    catch (e) { setError((e as Error).message); setBusy(""); }
  }
  async function act(item: Initiative, action: "duplicate" | "publish" | "delete") {
    if (action === "delete" && !confirm(`Delete “${item.title}” and its Cloudinary media permanently?`)) return;
    setBusy(item.id); setError(""); setMessage("");
    try {
      if (action === "duplicate") {
        const result = await request(`/api/admin/community/${item.id}/duplicate`, "POST");
        setMessage(result.note); router.push(`/admin/community/${result.id}`);
      } else if (action === "publish") {
        await request(`/api/admin/community/${item.id}/publication`, "PATCH", { publish: !item.is_published });
        setItems(current => current.map(x => x.id === item.id ? { ...x, is_published: !x.is_published } : x));
        setMessage(item.is_published ? "Initiative unpublished." : "Initiative published."); router.refresh();
      } else { await request(`/api/admin/community/${item.id}`, "DELETE"); setItems(current => current.filter(x => x.id !== item.id)); setMessage("Initiative deleted."); router.refresh(); }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  return <>
    <div className="admin-page-heading"><div><p>Content</p><h1>Community Activity</h1><span>Create and publish health camps without a deployment.</span></div><button type="button" className="admin-primary-button community-admin-create" onClick={create} disabled={!!busy}>{busy === "create" ? "Creating…" : "+ Create initiative"}</button></div>
    {error && <p className="admin-alert error" role="alert">{error}</p>}{message && <p className="community-admin-success" role="status">{message}</p>}
    <div className="admin-filters community-admin-filters"><label>Search title<input value={q} onChange={e => setQ(e.target.value)} placeholder="Search initiatives"/></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["Draft", "Upcoming", "Completed", "Archived"].map(x => <option key={x}>{x}</option>)}</select></label><label>Year<select value={year} onChange={e => setYear(e.target.value)}><option value="">All years</option>{years.map(x => <option key={x}>{x}</option>)}</select></label><label>Health topic<select value={topic} onChange={e => setTopic(e.target.value)}><option value="">All topics</option>{topics.map(x => <option key={x}>{x}</option>)}</select></label><label>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest created</option><option value="event">Event date</option></select></label></div>
    <div className="admin-table-wrap">{visible.length ? <table className="admin-table"><thead><tr><th>Initiative</th><th>Topic</th><th>Status</th><th>Event date</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>/{item.slug}</small></td><td>{item.topic || "—"}</td><td>{item.status}</td><td>{item.start_date || "Unverified"}</td><td>{item.is_published ? "Published" : "Unpublished"}</td><td><div className="community-admin-actions"><Link href={`/admin/community/${item.id}`}>Edit</Link><button type="button" disabled={!!busy} onClick={() => act(item, "duplicate")}>Duplicate draft</button><button type="button" disabled={!!busy} onClick={() => act(item, "publish")}>{item.is_published ? "Unpublish" : "Publish"}</button><Link href={item.is_published ? `/community-initiatives/${item.slug}` : `/admin/community/${item.id}/preview`} target="_blank">{item.is_published ? "View public page" : "Preview draft"}</Link><button type="button" disabled={!!busy} onClick={() => act(item, "delete")}>Delete</button></div></td></tr>)}</tbody></table> : <div className="admin-empty"><strong>No initiatives found</strong><p>{items.length ? "Try another search or filter." : "Create the first community initiative to get started."}</p></div>}</div>
  </>;
}
