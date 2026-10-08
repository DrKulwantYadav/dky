"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinary-loader";
import type { InitiativeDetail, InitiativeMedia, InitiativeService, InitiativeStatistic, InitiativeCoverage } from "@/lib/community";

type Service = Omit<InitiativeService, "id" | "initiative_id"> & { id?: string };
type Statistic = Omit<InitiativeStatistic, "id" | "initiative_id"> & { id?: string };
type Coverage = Omit<InitiativeCoverage, "id" | "initiative_id" | "created_at"> & { id?: string };
type Detail = Omit<InitiativeDetail, "services" | "statistics" | "coverage"> & { services: Service[]; statistics: Statistic[]; coverage: Coverage[] };

function RichEditor({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  const input = useRef<HTMLTextAreaElement>(null);
  function insert(prefix: string, suffix = "", placeholder = "text") {
    const element = input.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + prefix.length, start + prefix.length + selected.length); });
  }
  return <div className="wide community-rich-editor"><label htmlFor={`community-${label.replace(/\s+/g, "-").toLowerCase()}`}>{label}</label><div className="community-rich-toolbar" aria-label={`${label} formatting`}><button type="button" onClick={() => insert("**", "**")}>Bold</button><button type="button" onClick={() => insert("## ", "", "Heading")}>Heading</button><button type="button" onClick={() => insert("- ", "", "List item")}>List</button><button type="button" onClick={() => insert("[", "](https://example.com)", "link text")}>Link</button></div><textarea id={`community-${label.replace(/\s+/g, "-").toLowerCase()}`} ref={input} rows={rows} value={value} onChange={e => onChange(e.target.value)}/><small>Formatting appears in the public page preview.</small></div>;
}

async function api(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export default function CommunityEditor({ initial }: { initial: InitiativeDetail }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Detail>(initial);
  const [media, setMedia] = useState<InitiativeMedia[]>(initial.media);
  const [savedMedia, setSavedMedia] = useState<InitiativeMedia[]>(initial.media);
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const base = `/api/admin/community/${draft.id}`;
  function field<K extends keyof Detail>(key: K, value: Detail[K]) { setDraft(d => ({ ...d, [key]: value })); }
  function fail(e: unknown) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); setSuccess(""); }
  async function upload(files: FileList | null, kind: "gallery" | "coverage" | "covers") {
    if (!files?.length) return;
    setBusy("upload"); setError(""); setSuccess("");
    let completed = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && file.type !== "application/pdf") throw new Error("Select an image, video, or PDF file.");
        if (file.size > 100 * 1024 * 1024) throw new Error(`${file.name} is over the 100 MB upload limit.`);
        const signed = await api(`${base}/upload-signature`, "POST", { kind });
        const form = new FormData();
        form.set("file", file); form.set("api_key", signed.apiKey); form.set("timestamp", signed.timestamp); form.set("folder", signed.folder); form.set("signature", signed.signature);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloud}/auto/upload`, { method: "POST", body: form });
        const uploaded = await response.json();
        if (!response.ok) throw new Error(uploaded.error?.message || `Cloudinary could not upload ${file.name}.`);
        const record = await api(`${base}/media`, "POST", { public_id: uploaded.public_id, secure_url: uploaded.secure_url, resource_type: uploaded.resource_type, width: uploaded.width ?? null, height: uploaded.height ?? null, format: uploaded.format ?? null, bytes: uploaded.bytes ?? null, version: uploaded.version, signature: uploaded.signature, caption: "", alt_text: "", group_label: "", sort_order: media.length + completed, is_cover: false });
        setMedia(current => [...current, record]); setSavedMedia(current => [...current, record]); completed++;
      }
      setSuccess(`${completed} file${completed === 1 ? "" : "s"} uploaded. Add captions and alt text, then save changes.`);
      router.refresh();
    } catch (e) { fail(e); }
    finally { setBusy(""); if (fileInput.current) fileInput.current.value = ""; }
  }
  async function removeMedia(item: InitiativeMedia) {
    if (!confirm(`Delete ${item.caption || item.public_id} from Cloudinary and this initiative?`)) return;
    setBusy(item.id); setError("");
    try { await api(`${base}/media`, "DELETE", { id: item.id }); setMedia(x => x.filter(m => m.id !== item.id)); setSavedMedia(x => x.filter(m => m.id !== item.id)); setDraft(d => ({ ...d, cover_media_id: d.cover_media_id === item.id ? null : d.cover_media_id, coverage: d.coverage.map(x => x.media_id === item.id ? { ...x, media_id: null } : x) })); setSuccess("Media deleted from Cloudinary and the initiative."); router.refresh(); }
    catch (e) { fail(e); } finally { setBusy(""); }
  }
  async function save(publish = draft.is_published) {
    setBusy("save"); setError(""); setSuccess("");
    try {
      // Media details have their own endpoint because uploads and deletions can finish separately.
      for (const item of media) {
        const previous = savedMedia.find(x => x.id === item.id);
        if (!previous || ["caption", "alt_text", "group_label", "sort_order", "is_cover"].some(key => item[key as keyof InitiativeMedia] !== previous[key as keyof InitiativeMedia]))
          await api(`${base}/media`, "PATCH", { id: item.id, caption: item.caption, alt_text: item.alt_text, group_label: item.group_label, sort_order: item.sort_order, is_cover: item.id === draft.cover_media_id });
      }
      const payload = { title: draft.title, slug: draft.slug, summary: draft.summary, purpose: draft.purpose, highlights: draft.highlights, topic: draft.topic,
        status: draft.status, start_date: draft.start_date || null, end_date: draft.end_date || null, venue: draft.venue,
        cover_media_id: draft.cover_media_id, original_campaign_url: draft.original_campaign_url || null, registration_url: draft.registration_url || null,
        appointment_url: draft.appointment_url || "/book-appointment", seo_title: draft.seo_title || null, seo_description: draft.seo_description || null,
        is_published: publish, services: draft.services, statistics: draft.statistics, coverage: draft.coverage };
      await api(base, "PUT", payload);
      setSavedMedia(media);
      setDraft(d => ({ ...d, is_published: publish }));
      setSuccess(publish ? "Initiative saved and published." : "Draft saved. Public pages remain unchanged until you publish.");
      router.refresh();
    } catch (e) { fail(e); }
    finally { setBusy(""); }
  }
  function mediaField(id: string, key: keyof InitiativeMedia, value: string | number | boolean) { setMedia(current => current.map(x => x.id === id ? { ...x, [key]: value } : x)); }
  function chooseCover(id: string) { field("cover_media_id", id); setMedia(current => current.map(x => ({ ...x, is_cover: x.id === id }))); }
  return <div className="community-editor">
    <div className="admin-page-heading"><div><p>Content / Community Activity</p><h1>Edit initiative</h1><span>Save updates before opening the preview.</span></div><div className="community-admin-actions"><Link className="admin-secondary-button" href="/admin/community">← All initiatives</Link><Link className="admin-secondary-button" href={`/admin/community/${draft.id}/preview`} target="_blank">Preview</Link></div></div>
    {error && <div className="admin-alert error" role="alert">{error}</div>}{success && <div className="community-admin-success" role="status">{success}</div>}
    <div className="community-editor-toolbar"><button type="button" onClick={() => save(false)} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save draft"}</button><button type="button" onClick={() => save(true)} disabled={!!busy}>{draft.is_published ? "Save published changes" : "Publish initiative"}</button>{draft.is_published && <button type="button" onClick={() => save(false)} disabled={!!busy}>Unpublish</button>}<span>{draft.is_published ? "Published" : "Unpublished"}</span></div>
    <section className="admin-panel community-editor-section"><h2>Event details</h2><div className="community-editor-grid"><label>Title<input value={draft.title} onChange={e => field("title", e.target.value)} required/></label><label>URL slug<input value={draft.slug} onChange={e => field("slug", e.target.value)} pattern="[a-z0-9]+(-[a-z0-9]+)*" required/></label><label>Health topic<input value={draft.topic} onChange={e => field("topic", e.target.value)} placeholder="Heart Health"/></label><label>Status<select value={draft.status} onChange={e => field("status", e.target.value as Detail["status"])}>{["Draft", "Upcoming", "Completed", "Archived"].map(x => <option key={x}>{x}</option>)}</select></label><label>Start date<input type="date" value={draft.start_date || ""} onChange={e => field("start_date", e.target.value || null)}/></label><label>End date<input type="date" value={draft.end_date || ""} onChange={e => field("end_date", e.target.value || null)}/></label><label className="wide">Venue<input value={draft.venue} onChange={e => field("venue", e.target.value)}/></label><label className="wide">Short summary<textarea rows={3} value={draft.summary} onChange={e => field("summary", e.target.value)}/></label><RichEditor label="Purpose" value={draft.purpose} onChange={value => field("purpose", value)} rows={7}/><RichEditor label="Camp highlights" value={draft.highlights} onChange={value => field("highlights", value)} rows={9}/><label>Original campaign page URL<input type="url" value={draft.original_campaign_url || ""} onChange={e => field("original_campaign_url", e.target.value || null)}/></label><label>Registration URL for upcoming initiatives<input value={draft.registration_url || ""} onChange={e => field("registration_url", e.target.value || null)} placeholder="https://... or /..."/></label><label>Appointment CTA URL<input value={draft.appointment_url} onChange={e => field("appointment_url", e.target.value)}/></label><label>SEO title<input value={draft.seo_title || ""} onChange={e => field("seo_title", e.target.value || null)}/></label><label>SEO description<textarea rows={3} value={draft.seo_description || ""} onChange={e => field("seo_description", e.target.value || null)}/></label></div></section>
    <section className="admin-panel community-editor-section"><div className="community-editor-head"><div><h2>Services provided</h2><p>Only services marked delivered appear publicly.</p></div><button type="button" onClick={() => field("services", [...draft.services, { title: "", description: "", is_delivered: false, sort_order: draft.services.length }])}>+ Add service</button></div>{draft.services.map((service, i) => <div className="community-editor-row" key={service.id || `new-${i}`}><label>Service<input value={service.title} onChange={e => field("services", draft.services.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}/></label><label>Description<input value={service.description} onChange={e => field("services", draft.services.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}/></label><label className="check"><input type="checkbox" checked={service.is_delivered} onChange={e => field("services", draft.services.map((x, j) => j === i ? { ...x, is_delivered: e.target.checked } : x))}/> Delivered</label><button type="button" onClick={() => field("services", draft.services.filter((_, j) => j !== i))}>Remove</button></div>)}</section>
    <section className="admin-panel community-editor-section"><div className="community-editor-head"><div><h2>Attendance &amp; figures</h2><p>Keep figures private until verified.</p></div><button type="button" onClick={() => field("statistics", [...draft.statistics, { label: "", value: "", is_public: false, sort_order: draft.statistics.length }])}>+ Add figure</button></div>{draft.statistics.map((stat, i) => <div className="community-editor-row" key={stat.id || `new-${i}`}><label>Label<input value={stat.label} onChange={e => field("statistics", draft.statistics.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}/></label><label>Verified value<input value={stat.value} onChange={e => field("statistics", draft.statistics.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}/></label><label className="check"><input type="checkbox" checked={stat.is_public} onChange={e => field("statistics", draft.statistics.map((x, j) => j === i ? { ...x, is_public: e.target.checked } : x))}/> Public</label><button type="button" onClick={() => field("statistics", draft.statistics.filter((_, j) => j !== i))}>Remove</button></div>)}</section>
    <section className="admin-panel community-editor-section"><div className="community-editor-head"><div><h2>Gallery &amp; cover</h2><p>Upload to Cloudinary. Group photos by date or activity, then save their details.</p></div><div className="community-admin-actions"><label className="admin-secondary-button community-file-label">Upload gallery<input ref={fileInput} type="file" accept="image/*,video/*" multiple onChange={e => upload(e.target.files, "gallery")} disabled={!!busy}/></label><label className="admin-secondary-button community-file-label">Upload cover<input type="file" accept="image/*" onChange={e => upload(e.target.files, "covers")} disabled={!!busy}/></label></div></div><div className="community-media-grid">{media.filter(x => !x.public_id.includes("/coverage/")).map(item => <article key={item.id} className="community-media-editor-card"><div className="community-media-thumb">{item.resource_type === "image" ? <Image src={item.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_360,c_limit/")} alt={item.alt_text || "Gallery upload"} width={360} height={240} sizes="(max-width: 650px) 100vw, 33vw" loader={cloudinaryLoader}/> : <span>Video</span>}</div><label>Caption<input value={item.caption} onChange={e => mediaField(item.id, "caption", e.target.value)}/></label><label>Meaningful alt text<input value={item.alt_text} onChange={e => mediaField(item.id, "alt_text", e.target.value)}/></label><label>Photo date / activity group<input value={item.group_label} placeholder="29 September 2026" onChange={e => mediaField(item.id, "group_label", e.target.value)}/></label><label>Display order<input type="number" value={item.sort_order} onChange={e => mediaField(item.id, "sort_order", Number(e.target.value))}/></label><div className="community-media-actions">{item.resource_type === "image" && <label className="check"><input type="radio" name="cover" checked={draft.cover_media_id === item.id} onChange={() => chooseCover(item.id)}/> Cover image</label>}<button type="button" onClick={() => removeMedia(item)} disabled={!!busy}>Delete file</button></div></article>)}</div>{!media.length && <p className="community-editor-empty">No media yet. Add photos or videos from this dashboard.</p>}</section>
    <section className="admin-panel community-editor-section"><div className="community-editor-head"><div><h2>Media coverage</h2><p>Add only verified coverage and source links.</p></div><div className="community-admin-actions"><label className="admin-secondary-button community-file-label">Upload clipping / thumbnail<input type="file" accept="image/*,application/pdf" onChange={e => upload(e.target.files, "coverage")} disabled={!!busy}/></label><button type="button" onClick={() => field("coverage", [...draft.coverage, { coverage_type: "Online Article", publication_name: "", headline: "", published_date: null, source_url: null, media_id: null, summary: "", sort_order: draft.coverage.length }])}>+ Add coverage</button></div></div>{draft.coverage.map((row, i) => <div className="community-coverage-editor" key={row.id || `new-${i}`}><div className="community-editor-grid"><label>Type<select value={row.coverage_type} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, coverage_type: e.target.value as Coverage["coverage_type"] } : x))}>{["Newspaper Clipping", "Online Article", "Video", "Social Update"].map(x => <option key={x}>{x}</option>)}</select></label><label>Publication / source<input value={row.publication_name} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, publication_name: e.target.value } : x))}/></label><label>Headline<input value={row.headline} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, headline: e.target.value } : x))}/></label><label>Published date<input type="date" value={row.published_date || ""} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, published_date: e.target.value || null } : x))}/></label><label>External HTTPS URL<input type="url" value={row.source_url || ""} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, source_url: e.target.value || null } : x))}/></label><label>Uploaded clipping / thumbnail<select value={row.media_id || ""} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, media_id: e.target.value || null } : x))}><option value="">No file</option>{media.map(m => <option value={m.id} key={m.id}>{m.caption || m.public_id.split("/").at(-1)}</option>)}</select></label><label className="wide">Short description<textarea rows={3} value={row.summary} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, summary: e.target.value } : x))}/></label><label>Display order<input type="number" value={row.sort_order} onChange={e => field("coverage", draft.coverage.map((x, j) => j === i ? { ...x, sort_order: Number(e.target.value) } : x))}/></label></div><button type="button" onClick={() => field("coverage", draft.coverage.filter((_, j) => j !== i))}>Remove coverage</button></div>)}</section>
    <div className="community-editor-toolbar bottom"><button type="button" onClick={() => save(false)} disabled={!!busy}>Save draft</button><button type="button" onClick={() => save(true)} disabled={!!busy}>{draft.is_published ? "Save published changes" : "Publish initiative"}</button></div>
  </div>;
}
